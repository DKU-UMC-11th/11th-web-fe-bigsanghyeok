import { Link } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { AuthField, primaryButton } from "../../components/auth/auth-field";
import { isValidEmail } from "../../utils/auth-validation";
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("로그인 정보를 입력했어요.");
  }
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-[430px]">
        <h1 className="mb-6 text-[30px] font-extrabold tracking-[-1px]">
          로그인
        </h1>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <AuthField
            id="login-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            icon="/icons/mail.svg"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
            error={
              email.length > 0 && !isValidEmail(email)
                ? "올바른 이메일 형식을 입력해 주세요."
                : undefined
            }
          />
          <AuthField
            id="login-password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            icon="/icons/lock.svg"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage("");
            }}
          />
          <button
            type="submit"
            className={primaryButton}
            disabled={!isValidEmail(email) || !password}
          >
            로그인
          </button>
          {message && (
            <p role="status" className="text-center text-xs text-muted">
              {message}
            </p>
          )}
        </form>
        <p className="mt-5 text-center text-xs text-muted">
          처음이신가요?{" "}
          <Link to="/signup" className="font-bold text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
