const BASE_URL = "https://sistema-gastos-694972193726.southamerica-east1.run.app";

export async function criarUsuario(dados: { nome: string; email: string; senha: string }) {
  const resp = await fetch(`${BASE_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const data = await resp.json(); // pega o JSON da resposta

  // Retorna a resposta completa, mesmo em caso de erro
  return {
    ok: resp.ok,
    status: resp.status,
    data,
  };
}

export async function alterarUsuario(id: string, dados: { nome: string; email: string; senha: string }) {
  const resp = await fetch(`${BASE_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!resp.ok) throw new Error("Erro ao atualizar usuário");
  return resp.json();
}

export async function deletarUsuario(id: string) {
  const resp = await fetch(`${BASE_URL}/usuarios/${id}`, { method: "DELETE" });
  if (!resp.ok) throw new Error("Erro ao deletar usuário");
  return resp.json();
}

export async function loginPorEmailESenha(dados: { email: string; senha: string }) {
  const resp = await fetch(`${BASE_URL}/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  
  const data = await resp.json();
  
  // Retornamos a resposta da API mesmo em caso de erro
  return data;
}
