import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, distinctUntilChanged, switchMap, of, firstValueFrom } from 'rxjs';

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private cepCache = new Map<string, CepData>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private abortController: AbortController | null = null;
  private searchSubject = new BehaviorSubject<string>('');
  private readonly CACHE_KEY = 'cep_cache';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadCacheFromStorage();
    this.setupDebouncedSearch();
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Limpar entradas expiradas
        Object.entries(cacheData).forEach(([key, value]: [string, any]) => {
          if (now - value.timestamp < this.CACHE_EXPIRY) {
            this.cepCache.set(key, value.data);
          }
        });
      }
    } catch (error) {
      console.warn('Erro ao carregar cache de CEP:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheData: any = {};
      this.cepCache.forEach((value, key) => {
        cacheData[key] = {
          data: value,
          timestamp: Date.now()
        };
      });
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao salvar cache de CEP:', error);
    }
  }

  private setupDebouncedSearch(): void {
    this.searchSubject.pipe(
      debounceTime(500), // Aguarda 500ms após parar de digitar
      distinctUntilChanged(), // Só executa se o valor mudou
      switchMap(cep => {
        if (!cep || cep.length !== 8) {
          return of(null);
        }
        return this.performCepSearch(cep);
      })
    ).subscribe();
  }

  // Método público para busca com debounce
  searchCepDebounced(cep: string): Observable<CepData | null> {
    const cleanCep = cep.replace(/\D/g, '');
    this.searchSubject.next(cleanCep);
    
    return new Observable(observer => {
      const subscription = this.searchSubject.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(cleanCep => {
          if (!cleanCep || cleanCep.length !== 8) {
            return of(null);
          }
          return this.performCepSearch(cleanCep);
        })
      ).subscribe(result => {
        observer.next(result);
        observer.complete();
      });

      return () => subscription.unsubscribe();
    });
  }

  async searchCep(cep: string): Promise<CepData | null> {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Verificar cache primeiro
    if (this.cepCache.has(cleanCep)) {
      return this.cepCache.get(cleanCep)!;
    }

    return firstValueFrom(this.performCepSearch(cleanCep)).catch(() => null);
  }

  private performCepSearch(cleanCep: string): Observable<CepData | null> {
    return new Observable(observer => {
      // Cancelar requisição anterior se existir
      if (this.abortController) {
        this.abortController.abort();
      }

      this.abortController = new AbortController();
      this.loadingSubject.next(true);

      // Timeout para a requisição
      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
        observer.error(new Error('Timeout na busca do CEP'));
      }, this.REQUEST_TIMEOUT);

      const fetchPromise = fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: this.abortController.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      fetchPromise
        .then(response => {
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error('Erro na requisição');
          }
          
          return response.json();
        })
        .then((data: CepData) => {
          if (data.erro) {
            throw new Error('CEP não encontrado');
          }

          // Salvar no cache
          this.cepCache.set(cleanCep, data);
          this.saveCacheToStorage();
          
          observer.next(data);
          observer.complete();
        })
        .catch((error: any) => {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            observer.next(null); // Requisição foi cancelada
            observer.complete();
          } else {
            observer.error(error);
          }
        })
        .finally(() => {
          this.loadingSubject.next(false);
          this.abortController = null;
        });

      return () => {
        clearTimeout(timeoutId);
        this.abortController?.abort();
      };
    });
  }

  clearCache(): void {
    this.cepCache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  getCacheSize(): number {
    return this.cepCache.size;
  }

  // Método para validar CEP antes de fazer requisição
  isValidCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  }

  // Método para formatar CEP
  formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.replace(/(\d{5})(\d)/, '$1-$2');
  }
}
