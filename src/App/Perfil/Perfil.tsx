import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Edit3, Lock, LogOut } from "lucide-react";
import Menubar from "../Menubar/Menubar";

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do formulário - inicializados com dados do localStorage
  const [nome, setNome] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('userEmail') || '';
  });
  const [senha, setSenha] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(() => {
    return localStorage.getItem('userAvatar') || null;
  });
  const [numeroConta, setNumeroConta] = useState<string | null>(() => {
    return localStorage.getItem('numeroConta') || null;
  });
  
  // Estados de controle de edição
  const [isEditingNome, setIsEditingNome] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingSenha, setIsEditingSenha] = useState(false);
  
  // Estados de controle
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Estados de validação em tempo real
  const [nomeError, setNomeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");

  // Efeito para buscar os dados do usuário e escutar mudanças no localStorage
  useEffect(() => {
    const usuarioId = localStorage.getItem("userID");
    
    // Carrega dados da API se não estiverem no localStorage
    if (usuarioId && (!nome || !email)) {
      fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}`)
        .then(res => {
          if (!res.ok) throw new Error("Erro ao buscar dados do usuário");
          return res.json();
        })
        .then(data => {
          if (data && data.objeto) {
            const usuario = data.objeto;
            const nomeUsuario = usuario.nome || "";
            const emailUsuario = usuario.email || "";
            const fotoUsuario = usuario.fotoPerfil || null;
            
            // Atualiza estados
            setNome(nomeUsuario);
            setEmail(emailUsuario);
            setFotoPerfil(fotoUsuario);
            
            // Salva no localStorage
            if (nomeUsuario) localStorage.setItem('userName', nomeUsuario);
            if (emailUsuario) localStorage.setItem('userEmail', emailUsuario);
            if (fotoUsuario) localStorage.setItem('userAvatar', fotoUsuario);
          }
        })
        .catch(err => {
          console.error("Erro ao buscar dados do usuário:", err);
        });
    }

    // Buscar número da conta
    if (usuarioId && !numeroConta) {
      fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas`)
        .then(res => {
          if (!res.ok) throw new Error("Erro ao buscar contas");
          return res.json();
        })
        .then(data => {
          if (data && data.objeto && data.objeto.length > 0) {
            const ultimaConta = data.objeto[data.objeto.length - 1];
            const numeroContaAtual = ultimaConta.numero || ultimaConta.id;
            setNumeroConta(numeroContaAtual);
            localStorage.setItem("contaID", ultimaConta.id);
            localStorage.setItem("numeroConta", numeroContaAtual);
          }
        })
        .catch(err => {
          console.error("Erro ao buscar número da conta:", err);
        });
    }

    // Escutar mudanças no localStorage para atualizar dados em tempo real
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userAvatar') {
        setFotoPerfil(e.newValue);
      } else if (e.key === 'userName') {
        setNome(e.newValue || '');
      } else if (e.key === 'userEmail') {
        setEmail(e.newValue || '');
      } else if (e.key === 'numeroConta') {
        setNumeroConta(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [nome, email, numeroConta]);



  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrorMessage("A imagem deve ter no máximo 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageData = event.target.result as string;
          setFotoPerfil(imageData);
          // Salvar a imagem no localStorage seguindo padrão do Signup.tsx
          localStorage.setItem('userAvatar', imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };



  const saveProfile = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId) {
      setErrorMessage("Erro: Usuário não identificado");
      return;
    }

    if (!contaId) {
      setErrorMessage("Erro: Conta não identificada");
      return;
    }

    if (!nome.trim() || !email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Nome e e-mail são obrigatórios e precisam ser válidos");
      return;
    }

    setErrorMessage("");

    try {
      // Obtém os valores atuais do localStorage ou usa os valores dos estados
      const currentNome = nome.trim() || localStorage.getItem('userName');
      const currentEmail = email.trim() || localStorage.getItem('userEmail');
      const currentSenha = senha.trim() || localStorage.getItem('userPassword');

      if (!currentNome || !currentEmail || !currentSenha) {
        setErrorMessage("Preencha todos os campos obrigatórios ou verifique se existem dados salvos");
        return;
      }

      const requestBody = {
        nome: currentNome,
        email: currentEmail,
        senha: currentSenha
      };

      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.mensagem || "Seus dados foram salvos com sucesso!");
        
        // Salvar dados atualizados no localStorage
        localStorage.setItem('userName', nome.trim());
        localStorage.setItem('userEmail', email.trim());
        if (fotoPerfil) {
          localStorage.setItem('userAvatar', fotoPerfil);
        }
        
        // Limpar senha após salvar com sucesso
        setSenha("");
        setIsEditingSenha(false);
        
        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);
      } else {
        if (response.status === 404) {
          setErrorMessage("Usuário não foi encontrado no sistema");
        } else if (response.status === 409) {
          setErrorMessage("Este e-mail já está sendo usado por outro usuário");
        } else {
          setErrorMessage(data.mensagem || "Ocorreu um erro ao salvar seus dados");
        }
      }
    } catch (error) {
      setErrorMessage("Erro de conexão com o servidor. Por favor, tente novamente.");
    }
  };

  // Funções para habilitar edição de cada campo
  const handleEditNome = () => {
    setIsEditingNome(true);
    setNomeError("");
  };

  const handleEditEmail = () => {
    setIsEditingEmail(true);
    setEmailError("");
  };

  const handleEditSenha = () => {
    setIsEditingSenha(true);
    setSenhaError("");
  };

  // Validações em tempo real
  const handleNomeChange = (value: string) => {
    setNome(value);
    if (value.length > 0 && value.length < 3) {
      setNomeError("Nome deve ter pelo menos 3 caracteres");
    } else {
      setNomeError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  const handleSenhaChange = (value: string) => {
    setSenha(value);
    if (value.length > 0 && value.length < 6) {
      setSenhaError("Senha deve ter pelo menos 6 caracteres");
    } else {
      setSenhaError("");
    }
  };

  // Handlers de blur para salvar e desabilitar edição
  const handleNomeBlur = () => {
    setIsEditingNome(false);
    if (nome.trim() && !nomeError) {
      saveProfile();
    } else if (!nome.trim()) {
      setErrorMessage("O campo nome não pode ficar vazio");
      setNomeError("Campo obrigatório");
    }
  };

  const handleEmailBlur = () => {
    setIsEditingEmail(false);
    if (email.trim() && /\S+@\S+\.\S+/.test(email) && !emailError) {
      saveProfile();
    } else if (!email.trim()) {
      setErrorMessage("O campo email não pode ficar vazio");
      setEmailError("Campo obrigatório");
    } else {
      setErrorMessage("Por favor, insira um endereço de e-mail válido");
    }
  };

  const handleSenhaBlur = () => {
    setIsEditingSenha(false);
    if (senha.trim() && !senhaError) {
      saveProfile();
    } else if (senha.length > 0 && senhaError) {
      setErrorMessage("Senha inválida");
    }
  };

  return (
    <>
      <Menubar />

      {/* Header/card azul */}
      <div style={{
        position: 'fixed',
        top: '0px',
        bottom: '0px',
        width: '393px',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}>
        {/* Botão voltar */}
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '24px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            zIndex: 1002
          }}
          onClick={() => navigate('/home')}
        >
          <svg 
            width="34" 
            height="34" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>



        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '10px',
          marginBottom: '20%'
        }}>
          <div style={{ width: '40px' }}></div>
          
          {/* Botão para alterar foto */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              top: '21%',
              right: '38%',
              display: 'flex',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              padding: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              zIndex: 1003
            }}
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* Card com foto do perfil */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          top: '15px',
          position: 'relative',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: fotoPerfil ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
              backgroundImage: fotoPerfil ? `url(${fotoPerfil})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {!fotoPerfil && <User size={35} color="rgba(255, 255, 255, 0.7)" />}
            </div>
            

            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              style={{ display: 'none' }}
            />
          </div>
          
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '17px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '4px'
                          }}>
              {nome || 'Usuário'}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '400',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Conta: {numeroConta || 'Carregando...'}
            </div>
          </div>
        </div>
      </div>

      {/* Card branco com formulário */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '280px', 
        bottom: '0px',
        borderTopRightRadius: '16px',
        borderTopLeftRadius: '16px',
        width: '100%',
        backgroundColor: 'white',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          paddingBottom: '100px'
        }}>
          
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '24px',
            marginTop: '0'
          }}>
            Dados Pessoais
          </h2>

          {/* Campo Nome */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Nome Completo*
              </span>
              <Edit3 
                size={16} 
                style={{ color: '#0065F5', cursor: 'pointer' }}
                onClick={handleEditNome}
              />
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Digite seu nome completo"
              disabled={!isEditingNome}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${nomeError ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: isEditingNome ? '#ffffff' : '#f8fafc',
                color: isEditingNome ? '#000000' : '#64748b',
                cursor: isEditingNome ? 'text' : 'not-allowed'
              }}
              onFocus={(e) => { 
                if (isEditingNome) e.target.style.borderColor = nomeError ? '#ef4444' : '#2563eb'; 
              }}
              onBlur={(e) => { 
                e.target.style.borderColor = nomeError ? '#ef4444' : '#e2e8f0'; 
                handleNomeBlur();
              }}
            />
            {nomeError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {nomeError}
              </div>
            )}
          </div>

          {/* Campo E-mail */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                E-mail*
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '400', 
                  color: '#9ca3af',
                  marginLeft: '8px'
                }}>
                  (Chave Pix)
                </span>
              </span>
              <Edit3 
                size={16} 
                style={{ color: '#0065F5', cursor: 'pointer' }}
                onClick={handleEditEmail}
              />
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Digite seu e-mail"
              disabled={!isEditingEmail}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${emailError ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: isEditingEmail ? '#ffffff' : '#f8fafc',
                color: isEditingEmail ? '#000000' : '#64748b',
                cursor: isEditingEmail ? 'text' : 'not-allowed'
              }}
              onFocus={(e) => { 
                if (isEditingEmail) e.target.style.borderColor = emailError ? '#ef4444' : '#2563eb'; 
              }}
              onBlur={(e) => { 
                e.target.style.borderColor = emailError ? '#ef4444' : '#e2e8f0'; 
                handleEmailBlur();
              }}
            />
            {emailError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {emailError}
              </div>
            )}
          </div>

          {/* Campo Senha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Senha
              </span>
              <Edit3 
                size={16} 
                style={{ color: '#0065F5', cursor: 'pointer' }}
                onClick={handleEditSenha}
              />
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => handleSenhaChange(e.target.value)}
              placeholder="Digite sua nova senha"
              disabled={!isEditingSenha}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${senhaError ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: isEditingSenha ? '#ffffff' : '#f8fafc',
                color: isEditingSenha ? '#000000' : '#64748b',
                cursor: isEditingSenha ? 'text' : 'not-allowed'
              }}
              onFocus={(e) => { 
                if (isEditingSenha) e.target.style.borderColor = senhaError ? '#ef4444' : '#2563eb'; 
              }}
              onBlur={(e) => { 
                e.target.style.borderColor = senhaError ? '#ef4444' : '#e2e8f0'; 
                handleSenhaBlur();
              }}
            />
            {senhaError && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                {senhaError}
              </div>
            )}
          </div>

          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#16a34a',
              fontSize: '14px',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {successMessage}
            </div>
          )}

          {/* Container para centralizar o botão */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '24px'
          }}>
            {/* Botão Sair do App */}
            <button
              onClick={() => {
                // Limpar dados do localStorage
                localStorage.clear();
                // Redirecionar para login
                navigate('/login');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
            >
              Sair do app <LogOut size={20} />
            </button>
          </div>


        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Perfil;
