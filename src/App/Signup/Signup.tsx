import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { criarUsuario } from "../../services/usuarioService";
import Toast from "../../components/Toast";

const Cadastro: React.FC = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [avatarImage, setAvatarImage] = useState<string | null>(() => {
    return localStorage.getItem('userAvatar') || null;
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Estados para validação em tempo real
  const [nomeError, setNomeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [confirmarSenhaError, setConfirmarSenhaError] = useState("");

  // Validação do nome
  const handleNomeChange = (value: string) => {
    setNome(value);
    if (value.length > 0 && value.length < 3) {
      setNomeError("Nome deve ter pelo menos 3 caracteres");
    } else {
      setNomeError("");
    }
  };

  // Validação do email
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  // Validação da senha
  const handleSenhaChange = (value: string) => {
    setSenha(value);
    if (value.length > 0 && value.length < 6) {
      setSenhaError("Senha deve ter pelo menos 6 caracteres");
    } else {
      setSenhaError("");
    }
    // Revalidar confirmação se já foi preenchida
    if (confirmarSenha.length > 0 && value !== confirmarSenha) {
      setConfirmarSenhaError("As senhas não coincidem");
    } else if (confirmarSenha.length > 0) {
      setConfirmarSenhaError("");
    }
  };

  // Validação da confirmação de senha
  const handleConfirmarSenhaChange = (value: string) => {
    setConfirmarSenha(value);
    if (value.length > 0 && value !== senha) {
      setConfirmarSenhaError("As senhas não coincidem");
    } else {
      setConfirmarSenhaError("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageData = event.target.result as string;
          setAvatarImage(imageData);
          // Salvar a imagem no localStorage
          localStorage.setItem('userAvatar', imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      setToast({ message: "❌ As senhas não coincidem!", type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const novoUsuario = { nome, email, senha };
      const resposta = await criarUsuario(novoUsuario);

      if (!resposta.ok) {
        setToast({ message: `${resposta.data.mensagem}`, type: 'error' });
      } else {
        setToast({ message: `✅ ${resposta.data.mensagem}`, type: 'success' });
        // Salvar nome e avatar localmente
        localStorage.setItem("userName", resposta.data.objeto.nome);
        localStorage.setItem("userID", resposta.data.objeto.id);
        if (avatarImage) localStorage.setItem("userAvatar", avatarImage);
        
        // Aguardar um pouco para o usuário ver o toast antes de navegar
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: `⚠️ ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "393px",
        height: "852px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      
      {/* Logo */}
      <div
        style={{
          width: "100%",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <h1
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
            color: "#000000ff",
            margin: 0,
          }}
        >
          <span style={{ fontWeight: 600, color: "#0065F5" }}>agi</span>
          <span style={{ fontWeight: 260, color: "#0065F5" }}>Control</span>
        </h1>
      </div>

      {/* Avatar */}
      <div style={{ marginBottom: "16px", position: "relative" }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{
            position: "absolute",
            width: "125px",
            height: "125px",
            borderRadius: "50%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        />
        {avatarImage ? (
          <img
            src={avatarImage}
            alt="avatar"
            style={{
              width: "125px",
              height: "125px",
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "center",
              border: "3px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              cursor: "pointer",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "125px",
              height: "125px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              border: "3px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "50px", color: "#999999" }}>👤</span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            backgroundColor: "white",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ color: "#000000", fontSize: "16px" }}>✏️</span>
        </div>
      </div>

      {/* Card de formulário */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "350px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
              }}
            >
              Nome:
            </label>
            <input
              type="text"
              placeholder="Digite seu nome"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              required
              className="custom-input"
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${nomeError ? '#ef4444' : '#D2D2D2'}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {nomeError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {nomeError}
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
              }}
            >
              Email:
            </label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              className="custom-input"
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${emailError ? '#ef4444' : '#D2D2D2'}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {emailError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {emailError}
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000ff",
              }}
            >
              Senha:
            </label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => handleSenhaChange(e.target.value)}
              required
              className="custom-input"
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${senhaError ? '#ef4444' : '#D2D2D2'}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {senhaError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {senhaError}
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Confirme sua senha:
            </label>
            <input
              type="password"
              placeholder="Confirme sua senha"
              value={confirmarSenha}
              onChange={(e) => handleConfirmarSenhaChange(e.target.value)}
              required
              className="custom-input"
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${confirmarSenhaError ? '#ef4444' : '#D2D2D2'}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {confirmarSenhaError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {confirmarSenhaError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "55%",
                padding: "12px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "80px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Cadastrando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>

      {/* Link para voltar ao Login - Movido para fora do card */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "12px",
        width: "100%",
        maxWidth: "350px"
      }}>
        <p style={{ 
          fontSize: "14px", 
          color: "#6b7280", 
          margin: "0" 
        }}>
          Já possui uma conta?
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            textDecoration: "underline",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#1d4ed8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#2563eb";
          }}
        >
          Fazer login
        </button>
      </div>
    </div>
  );
};


export default Cadastro;

