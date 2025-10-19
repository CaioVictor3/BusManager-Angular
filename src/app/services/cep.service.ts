import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private cepCache = new Map<string, CepData>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private abortController: AbortController | null = null;

  public loading$ = this.loadingSubject.asObservable();

  async searchCep(cep: string): Promise<CepData | null> {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Verificar cache primeiro
    if (this.cepCache.has(cleanCep)) {
      return this.cepCache.get(cleanCep)!;
    }

    // Cancelar requisição anterior se existir
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.loadingSubject.next(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: this.abortController.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro na requisição');
      }
      
      const data: CepData = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Salvar no cache
      this.cepCache.set(cleanCep, data);
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null; // Requisição foi cancelada
      }
      throw error;
    } finally {
      this.loadingSubject.next(false);
      this.abortController = null;
    }
  }

  clearCache(): void {
    this.cepCache.clear();
  }

  getCacheSize(): number {
    return this.cepCache.size;
  }
}
