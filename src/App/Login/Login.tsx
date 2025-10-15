import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/images/background.png";
import { loginPorEmailESenha } from "../../services/usuarioService";
import Toast from "../../components/Toast";


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [avatarImage] = useState<string | null>(() => {
    return localStorage.getItem('userAvatar') || null;
  });
  const [userName] = useState<string>(() => {
    return localStorage.getItem('userName') || 'Usuário';
  });
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");

  // Validação em tempo real do email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (!value) {
      setEmailError("");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  // Validação em tempo real da senha
  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSenha(value);
    
    if (!value) {
      setSenhaError("");
    } else if (value.length < 6) {
      setSenhaError("Senha deve ter no mínimo 6 caracteres");
    } else {
      setSenhaError("");
    }
  };
    
  // 🔹 Função de login com API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!email || !senha) {
      setToast({ message: '⚠️ Preencha e-mail e senha!', type: 'warning' });
      return;
    }
  
    setLoading(true);
  
    try {
      const resposta = await loginPorEmailESenha({ email, senha });
      
      if (!resposta) {
        throw new Error("Sem resposta da API");
      }

      // A API retorna a mensagem apropriada para cada caso
      if (resposta.status === "OK") {
        setToast({ message: `✅ ${resposta.mensagem}`, type: 'success' });
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", resposta.objeto.nome);
        localStorage.setItem("userID", resposta.objeto.id);
        
        // Aguardar um pouco para o usuário ver o toast antes de navegar
        setTimeout(() => {
          setShowLoginPopup(false);
          navigate("/home");
        }, 1500);
      } else {
        setToast({ message: `${resposta.mensagem}`, type: 'error' });
      }
    } catch (erro) {
      console.error("Erro ao tentar logar:", erro);
      setToast({ message: '⚠️ Ocorreu um erro de conexão. Por favor, tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
    
  const handleQuickLogin = () => {
    setShowLoginPopup(true);
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      
      <style>{`
        .login-input::placeholder {
          color: #9CA3AF !important;
          opacity: 1;
        }
        .login-input::-webkit-input-placeholder {
          color: #9CA3AF !important;
        }
        .login-input::-moz-placeholder {
          color: #9CA3AF !important;
          opacity: 1;
        }
        .login-input:-ms-input-placeholder {
          color: #9CA3AF !important;
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '393px',
        height: '852px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxSizing: 'border-box',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        
        /* Ocultar barra de scroll mantendo funcionalidade */
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}>
      
        {/* Logo */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '16px',
          zIndex: 2
        }}>
          <h1
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: "32px",
              color: "white",
              margin: 0
            }}
          >
            <span style={{ fontWeight: 600, color: "white" }}>agi</span>
            <span style={{ fontWeight: 260, color: "white" }}>Control</span>
          </h1>
        </div>

        {/* Botão voltar */}
        <button 
          onClick={handleBackClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'absolute',
            top: '70px',
            right: '99px',
            fontSize: '16px',
            zIndex: 2
          }}
        >
          <ArrowLeft size={24} />
          Voltar
        </button>

        {/* Avatar */}
        <div style={{
          position: 'absolute',
          left: '45px',
          top: '50%',
          transform: 'translateY(-50%)',
          marginTop: '-40px',
          zIndex: 2
        }}>
          {avatarImage ? (
            <img
              src={avatarImage}
              alt="avatar"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '2px solid white',
                objectFit: 'cover',
                objectPosition: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid white',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: '#999999',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              👤
            </div>
          )}
        </div>

        {/* Saudação */}
        <div style={{
          position: 'absolute',
          left: '45px',
          top: '50%',
          transform: 'translateY(-50%)',
          marginTop: '30px',
          width: 'calc(100% - 32px)',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 -30px 0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.3',
            textAlign: 'left',
            color: 'white'
          }}>
            {userName && userName !== 'Usuário' ? (
              <>
                Que bom te ver de novo,<br />
                {userName}!
              </>
            ) : (
              <>
                Organize suas finanças<br />
                de forma simples e Ágil!
              </>
            )}
          </h2>
        </div>
        
        <div style={{
          position: 'absolute',
          left: '45px',
          top: '50%',
          transform: 'translateY(-50%)',
          marginTop: '90px',
          width: 'calc(100% - 32px)',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#CAFC92',
            textAlign: 'left'
          }}>
            {userName && userName !== 'Usuário' ? 'Bora agilizar?' : 'Comece agora mesmo!'}
          </h2>
        </div>

        {/* Botões */}
        <div style={{ 
          position: 'absolute',
          left: '45px',
          bottom: '30px',
          transform: 'translateY(-50%)',
          marginTop: '160px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          width: 'calc(100% - 90px)',
          maxWidth: '350px',
          zIndex: 2
        }}>
          
          {/* Botão Entrar */}
          <button
            type="button"
            onClick={handleQuickLogin}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'white',
              color: '#2563eb',
              border: '2px solid #2563eb',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#ffffffff';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
            }}
          >
            Entrar
          </button>

          {/* Botão Cadastrar-se */}
          <button
            type="button"
            onClick={handleSignup}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Pop-up de Login */}
        {showLoginPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '300px',
              boxShadow: '0 10px 25px #0000004d'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                textAlign: 'center',
                color: '#2563eb',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Entrar na conta
              </h3>
              
              <form onSubmit={handleLogin} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Digite seu email"
                    required
                    className="login-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${emailError ? '#ef4444' : '#D2D2D2'}`,
                      borderRadius: '120px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000ff',
                      backgroundColor: 'white'
                    }}
                  />
                  {emailError && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '12px',
                      marginTop: '4px',
                      marginLeft: '12px'
                    }}>
                      {emailError}
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Senha:
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={handleSenhaChange}
                    placeholder="Digite sua senha"
                    required
                    className="login-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${senhaError ? '#ef4444' : '#D2D2D2'}`,
                      borderRadius: '120px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000ff',
                      backgroundColor: 'white'
                    }}
                  />
                  {senhaError && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '12px',
                      marginTop: '4px',
                      marginLeft: '12px'
                    }}>
                      {senhaError}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowLoginPopup(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #D2D2D2',
                      borderRadius: '120px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '120px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </div>

                {/* Link para criar conta */}
                <div style={{ 
                  textAlign: "center", 
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e5e7eb"
                }}>
                  <p style={{ 
                    fontSize: "13px", 
                    color: "#6b7280", 
                    margin: "0 0 6px 0" 
                  }}>
                    Não possui uma conta?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPopup(false);
                      navigate("/signup");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "14px",
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
                    Criar conta agora
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};


export default Login;

