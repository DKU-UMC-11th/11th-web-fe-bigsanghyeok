import { Link } from "@tanstack/react-router";
import { useRef, useState, type SubmitEvent } from "react";
import { checkEmailDuplicate } from "../../api/members/check-email-duplicate";
import { checkNicknameDuplicate } from "../../api/members/check-nickname-duplicate";
import { signup } from "../../api/members/signup";
import { AuthField, primaryButton } from "../../components/auth/auth-field";
import {
  isValidEmail,
  isValidNickname,
  PASSWORD_REGEX,
} from "../../utils/auth-validation";
const initialForm = {
  email: "",
  nickname: "",
  password: "",
  passwordConfirm: "",
};
type Field = keyof typeof initialForm;
type DuplicateField = "email" | "nickname";
const initialCheck = { isChecking: false, isAvailable: false };
export function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [checks, setChecks] = useState({
    email: initialCheck,
    nickname: initialCheck,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checking = useRef({ email: false, nickname: false });
  const submitting = useRef(false);
  const emailValid = isValidEmail(form.email);
  const nicknameValid = isValidNickname(form.nickname);
  const passwordValid = PASSWORD_REGEX.test(form.password);
  const confirmValid =
    form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
  const canSubmit =
    emailValid &&
    nicknameValid &&
    passwordValid &&
    confirmValid &&
    checks.email.isAvailable &&
    checks.nickname.isAvailable;
  function change(field: Field, value: string) {
    if (
      submitting.current ||
      ((field === "email" || field === "nickname") && checking.current[field])
    )
      return;
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "email" || field === "nickname")
      setChecks((current) => ({ ...current, [field]: initialCheck }));
  }
  async function check(field: DuplicateField) {
    if (
      submitting.current ||
      checking.current[field] ||
      !(field === "email" ? emailValid : nicknameValid)
    )
      return;
    checking.current[field] = true;
    setChecks((current) => ({
      ...current,
      [field]: { isChecking: true, isAvailable: false },
    }));
    const label = field === "email" ? "이메일" : "닉네임";
    try {
      const response =
        field === "email"
          ? await checkEmailDuplicate(form.email.trim())
          : await checkNicknameDuplicate(form.nickname.trim());
      setChecks((current) => ({
        ...current,
        [field]: {
          isChecking: false,
          isAvailable: response.available === true,
        },
      }));
      window.alert(
        response.available
          ? `사용할 수 있는 ${label}이에요.`
          : `이미 사용 중인 ${label}이에요.`,
      );
    } catch {
      setChecks((current) => ({ ...current, [field]: initialCheck }));
      window.alert("중복 확인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      checking.current[field] = false;
    }
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const response = await signup({
        email: form.email.trim(),
        nickname: form.nickname.trim(),
        password: form.password,
      });
      window.alert(response.message);
    } catch {
      window.alert("회원가입에 실패했어요. 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }
  const action = (field: DuplicateField) => (
    <button
      type="button"
      aria-label={(field === "email" ? "이메일" : "닉네임") + " 중복 확인"}
      disabled={
        isSubmitting ||
        checks[field].isChecking ||
        !(field === "email" ? emailValid : nicknameValid)
      }
      onClick={() => void check(field)}
      className="shrink-0 text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {checks[field].isChecking
        ? "확인 중"
        : checks[field].isAvailable
          ? "확인 완료"
          : "중복 확인"}
    </button>
  );
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-[430px]">
        <h1 className="mb-6 text-[30px] font-extrabold tracking-[-1px]">
          회원가입
        </h1>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <AuthField
            id="signup-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => change("email", e.target.value)}
            disabled={isSubmitting || checks.email.isChecking}
            error={
              form.email.length > 0 && !emailValid
                ? "올바른 이메일 형식을 입력해 주세요."
                : undefined
            }
            action={action("email")}
          />
          <AuthField
            id="signup-nickname"
            label="닉네임"
            autoComplete="nickname"
            placeholder="2–12자"
            value={form.nickname}
            onChange={(e) => change("nickname", e.target.value)}
            disabled={isSubmitting || checks.nickname.isChecking}
            error={
              form.nickname.length > 0 && !nicknameValid
                ? "닉네임은 2~12자로 입력해 주세요."
                : undefined
            }
            action={action("nickname")}
          />
          <AuthField
            id="signup-password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            value={form.password}
            onChange={(e) => change("password", e.target.value)}
            disabled={isSubmitting}
            help="영문 대·소문자, 숫자, 특수문자(!@#$%^&*)를 모두 포함해 8자 이상 입력해 주세요."
            error={
              form.password.length > 0 && !passwordValid
                ? "영문 대·소문자, 숫자, 특수문자(!@#$%^&*)를 포함해 8자 이상 입력해 주세요."
                : undefined
            }
          />
          <AuthField
            id="signup-confirm"
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="다시 입력"
            value={form.passwordConfirm}
            onChange={(e) => change("passwordConfirm", e.target.value)}
            disabled={isSubmitting}
            error={
              form.passwordConfirm.length > 0 && !confirmValid
                ? "비밀번호가 일치하지 않아요."
                : undefined
            }
          />
          <button
            className={primaryButton}
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "가입 중" : "가입하기"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
