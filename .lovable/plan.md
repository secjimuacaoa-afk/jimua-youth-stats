## Plano: Teste end-to-end do fluxo do Secretário Local

Vou executar um teste automatizado (Playwright) que faz login como Secretário Local e valida o CRUD completo de jovens da sua igreja.

### Credenciais usadas
- Email: `secretario@jimua.org`
- Senha: `Local123456`
- Igreja associada: Belém (Circuito Rangel)

### Cenários a testar

1. **Login e restrições de perfil**
   - Login com sucesso e redireccionamento para `/dashboard`
   - Confirmar cabeçalho: "Secretário Local — Belém"
   - Confirmar que abas restritas (Utilizadores, Estruturas nível superior) não aparecem

2. **Listagem de jovens (aba Jovens)**
   - Só mostra jovens da igreja Belém (filtro automático)
   - Botão "Novo Jovem" visível (ao contrário do admin)

3. **Criar novo jovem**
   - Preencher: nome, sexo, data de nascimento (idade 12–25), categoria, escolaridade, ocupação, estado civil, origem, documentação (multi-select), semestre/ano
   - Validar cálculo automático de parte etária (12–17 vs 18–25) e flag OJA (>25)
   - Submeter e confirmar aparição na lista

4. **Editar jovem**
   - Abrir jovem criado, alterar categoria (ex.: J→K), gravar
   - Verificar que registo de auditoria foi criado em `jovens_audit`

5. **Inactivar jovem**
   - Marcar como inactivo com motivo (ex.: "E — Estudo/Trabalho")
   - Confirmar que aparece filtrado como inactivo

6. **Validações de negócio**
   - Tentar criar jovem sem documentação → deve falhar
   - Tentar criar jovem com data de nascimento inválida
   - Confirmar que não vê jovens de outras igrejas (RLS)

### Entregável
Screenshots por passo em `/tmp/browser/local-flow/screenshots/` + relatório com:
- ✅ / ❌ por cenário
- Erros de consola ou network (se houver)
- Query final ao Supabase confirmando o jovem criado e o registo de auditoria

Se algum passo falhar, reporto o bug com evidência antes de propor correcção (não corrijo nesta iteração — só teste).
