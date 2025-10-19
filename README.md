# Bus Manager - Gerenciador de Rotas de Transporte

Sistema web mobile-first para gerenciamento de rotas de transporte de alunos por topiqueiros.

## 🚌 Funcionalidades

- Cadastro e login de topiqueiros
- Cadastro completo de alunos com validação de CEP
- Controle de presença dos alunos
- Configuração de ponto de partida e chegada
- Cálculo de rota otimizada usando OpenStreetMap (OSM)
- Visualização da rota no mapa
- Navegação via OpenStreetMap
- Persistência local dos dados (localStorage)
- Interface responsiva e intuitiva

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3, JavaScript ES6+
- Bootstrap 5, Font Awesome
- OpenStreetMap (OSM) - Nominatim e OSRM
- ViaCEP API (validação de endereços)
- LocalStorage (persistência)

## 🚀 Instalação Rápida

1. Baixe os arquivos para uma pasta local
2. Execute `npm install` para instalar as dependências
3. Execute `npm start` para iniciar o servidor de desenvolvimento
4. Acesse `http://localhost:4200` no seu navegador

## ⚙️ Configuração

### OpenStreetMap (OSM)

O sistema utiliza OpenStreetMap para todas as funcionalidades de mapas:
- **Nominatim**: Para geocodificação de endereços
- **OSRM**: Para cálculo de rotas
- **OpenRouteService**: Para navegação

Não é necessária configuração adicional, pois utiliza serviços gratuitos e públicos.

### ViaCEP API

A validação de CEP usa a API gratuita ViaCEP. Não requer configuração adicional.

## 📁 Estrutura de Arquivos

```
Bus Manager/
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   └── config/
│   ├── index.html
│   └── styles.css
├── package.json
├── angular.json
└── README.md
```

## 💾 Gerenciamento de Dados

- Topiqueiros: Salvos no localStorage
- Alunos: Salvos no localStorage
- Sessão ativa: Persistente entre recarregamentos
- Configurações de rota: Salvas localmente

## ✅ Checklist de Validação

- [x] Cadastro e login de topiqueiro
- [x] Cadastro de alunos com validação de CEP
- [x] Controle de presença
- [x] Edição e exclusão de alunos
- [x] Configuração de pontos de rota
- [x] Cálculo e visualização de rota otimizada
- [x] Persistência dos dados
- [x] Interface responsiva

## 🚨 Problemas Conhecidos

- OpenStreetMap: Pode ter limitações de uso em requisições muito frequentes
- ViaCEP: Pode ter limitações de uso
- LocalStorage: Dados ficam no navegador específico

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais