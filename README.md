# WKG Play Player

Player estático, responsivo e alimentado pela API pública do AzuraCast.

## Publicação

Após o DNS apontar `radio.wkgplay.com.br` para a VPS, este diretório deve ser publicado por trás de um proxy HTTPS que encaminhe a API e as rotas de áudio para o AzuraCast. O proxy é necessário porque o AzuraCast já ocupa as portas públicas 80 e 443 da VPS. O proxy também deve aplicar fallback para `index.html`, para que cada URL de cliente carregue o mesmo player.

## Uso

- `https://radio.wkgplay.com.br/bia-fit` → estação `bia_fit`
- `https://radio.wkgplay.com.br/bio-festas` → estação `bio_festas`
- `https://radio.wkgplay.com.br/?station=bia_fit` (suporte técnico)

O código consulta `/api/nowplaying/<slug>` e usa a rota HTTPS local `/listen/<slug>/radio.mp3`. Assim, o título, capa e faixa atual são sempre da rádio correta sem conteúdo misto nem o certificado interno do AzuraCast.

## Próxima etapa de infraestrutura

Antes da publicação pública, configurar um reverse proxy na VPS que preserve o AzuraCast e sirva este player sob um subdomínio dedicado. Não substituir os containers nem tomar as portas sem um backup válido.
