# Bus Manager - Gerenciador de Rotas de Transporte

Sistema web mobile-first para gerenciamento de rotas de transporte de alunos por topiqueiros.

## 🚌 Funcionalidades

- Cadastro e login de topiqueiros
- Cadastro completo de alunos com validação de CEP
- Controle de presença dos alunos
- Configuração de ponto de partida e chegada
- Cálculo de rota otimizada usando Google Maps API
- Visualização da rota no mapa
- Navegação via Google Maps
- Persistência local dos dados (localStorage)
- Interface responsiva e intuitiva

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3, JavaScript ES6+
- Bootstrap 5, Font Awesome
- Google Maps JavaScript API
- ViaCEP API (validação de endereços)
- LocalStorage (persistência)

## 🚀 Instalação Rápida

1. Baixe os arquivos para uma pasta local
2. Configure a API do Google Maps:
   - Copie `config.example.js` para `config.js`
   - Edite `config.js` e adicione sua chave da API do Google Maps
3. Abra o arquivo `index.html` no seu navegador

## ⚙️ Configuração

### Google Maps API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API "Maps JavaScript API"
4. Gere uma chave de API
5. Copie o arquivo `config.example.js` para `config.js`
6. Substitua `'YOUR_API_KEY_HERE'` pela sua chave no campo `GOOGLE_MAPS_API_KEY`

```javascript
// No arquivo config.js
GOOGLE_MAPS_API_KEY: 'SUA_CHAVE_AQUI',
```

### ViaCEP API

A validação de CEP usa a API gratuita ViaCEP. Não requer configuração adicional.

## 📁 Estrutura de Arquivos

```
Bus Manager/
├── index.html
├── style.css
├── script.js
├── config.js
├── config.example.js
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

- Google Maps: Requer chave de API válida
- ViaCEP: Pode ter limitações de uso
- LocalStorage: Dados ficam no navegador específico

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais