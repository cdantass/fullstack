import LoginForm from "../components/LoginForm";

function Login() {
  return (
    <div className="bg-sky-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <img
          src="./public/images/logo_prevencao_corrupcao.png"
          alt="Logo"
          className="mx-auto mb-4 w-80 h-32"
        />
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;
