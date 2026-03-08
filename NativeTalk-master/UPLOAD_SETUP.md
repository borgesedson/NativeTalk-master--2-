# Guia de Configuração - Upload de Fotos

## 1. Instalar Dependências no Backend

```bash
cd backend
npm install multer multer-storage-cloudinary cloudinary
```

## 2. Criar Conta no Cloudinary (Grátis)

1. Acesse: https://cloudinary.com/
2. Crie uma conta gratuita
3. No Dashboard, copie:
   - Cloud Name
   - API Key
   - API Secret

## 3. Adicionar no backend/.env

Adicione estas linhas no arquivo `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=seu_api_secret_aqui
```

## 4. Reiniciar o Backend

```bash
cd backend
npm run dev
```

## Funcionalidades Implementadas

✅ **Duas Opções de Foto:**
- Avatar Aleatório (botão "Use Avatar")
- Upload de Foto Própria (botão "Upload Photo")

✅ **Preview em Tempo Real:**
- Vê a foto antes de salvar

✅ **Upload Seguro:**
- Cloudinary hospeda as imagens
- Aceita: JPG, JPEG, PNG, WEBP
- Redimensiona automaticamente para 500x500px

✅ **Backend:**
- Endpoint `/api/auth/update-profile`
- Suporta FormData
- Atualiza Stream Chat automaticamente

## Como Usar

1. Usuário vai em Settings
2. Escolhe entre "Use Avatar" ou "Upload Photo"
3. Se Avatar: clica em "Generate Avatar"
4. Se Upload: seleciona arquivo do computador
5. Clica em "Save Changes"
6. Foto atualizada em todo o app!
