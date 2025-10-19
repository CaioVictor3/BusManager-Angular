import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

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
  private searchSubject = new Subject<string>();
  private readonly CACHE_KEY = 'cep_cache';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  public loading$ = this.loadingSubject.asObservable();
  public searchResult$: Observable<CepData | null>;

  constructor() {
    this.loadCacheFromStorage();
    this.searchResult$ = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.loadingSubject.next(true)),
      switchMap(cep => this.isValidCep(cep) ? this.fetchCep(cep) : of(null)),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        console.error('Erro na busca de CEP:', error);
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
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

  searchCep(cep: string): void {
    const cleanCep = cep.replace(/\D/g, '');
    this.searchSubject.next(cleanCep);
  }

  private fetchCep(cep: string): Observable<CepData | null> {
    if (this.cepCache.has(cep)) {
      return of(this.cepCache.get(cep)!);
    }

    return new Observable(observer => {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, this.REQUEST_TIMEOUT);

      fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: abortController.signal })
        .then(response => {
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error('Erro na requisição');
          }
          return response.json();
        })
        .then(data => {
          if (data.erro) {
            observer.next(null);
          } else {
            this.cepCache.set(cep, data);
            this.saveCacheToStorage();
            observer.next(data);
          }
          observer.complete();
        })
        .catch(error => {
          clearTimeout(timeoutId);
          if (error.name !== 'AbortError') {
            console.error('Erro ao buscar CEP:', error);
          }
          observer.next(null);
          observer.complete();
        });

      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
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

  isValidCep(cep: string): boolean {
    return /^\d{8}$/.test(cep);
  }

  formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return cep;
    return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}
