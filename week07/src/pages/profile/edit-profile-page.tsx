import { checkNicknameDuplicate } from "../../api/members/check-nickname-duplicate";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { AuthField, primaryButton } from "../../components/auth/auth-field";
import {
  useProfile,
  ProfileAvatar,
} from "../../components/profile/profile-provider";
import { isValidNickname } from "../../utils/auth-validation";
export function EditProfilePage() {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(profile.nickname);
  const [image, setImage] = useState(profile.image);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(
    profile.nickname,
  );
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkingRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const readerRef = useRef(0);
  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("5MB 이하의 이미지 파일을 선택해 주세요.");
      event.target.value = "";
      return;
    }
    setIsReading(true);
    setError("");
    const version = ++readerRef.current;
    const reader = new FileReader();
    reader.onload = () => {
      if (version === readerRef.current) {
        setImage(typeof reader.result === "string" ? reader.result : null);
        setIsReading(false);
      }
    };
    reader.onerror = () => {
      if (version === readerRef.current) {
        setError("이미지를 읽지 못했어요. 다시 선택해 주세요.");
        setIsReading(false);
      }
    };
    reader.readAsDataURL(file);
  }
  async function check() {
    if (!isValidNickname(nickname) || checkingRef.current) return;
    checkingRef.current = true;
    setIsChecking(true);
    setCheckedNickname(null);
    try {
      const response = await checkNicknameDuplicate(nickname.trim());
      if (response.available) setCheckedNickname(nickname.trim());
      window.alert(
        response.available
          ? "사용할 수 있는 닉네임이에요."
          : "이미 사용 중인 닉네임이에요.",
      );
    } catch {
      window.alert("중복 확인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }
  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !isValidNickname(nickname) ||
      checkedNickname !== nickname.trim() ||
      isReading ||
      isChecking
    )
      return;
    updateProfile({ nickname: nickname.trim(), image });
    void navigate({ to: "/my" });
  }
  return (
    <main className="mx-auto flex w-[calc(100%-40px)] max-w-[1280px] flex-1 flex-col pt-6 pb-7 min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)]">
      <form onSubmit={save} className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-1px]">
              내 정보 수정
            </h1>
            <p className="mt-2 text-sm text-muted">
              닉네임과 프로필 이미지만 변경할 수 있어요.
            </p>
          </div>
          <button
            type="submit"
            className={primaryButton}
            disabled={
              !isValidNickname(nickname) ||
              checkedNickname !== nickname.trim() ||
              isReading ||
              isChecking
            }
          >
            변경사항 저장
          </button>
        </div>
        <div className="mt-9 grid items-start gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center pt-5">
            <button
              type="button"
              aria-label="프로필 이미지 변경"
              className="relative"
              onClick={() => fileInput.current?.click()}
            >
              <ProfileAvatar image={image} />
              <span className="absolute right-0 bottom-0 rounded-full bg-background">
                <img src="/icons/edit.svg" width="24" height="24" alt="" />
              </span>
            </button>
            <p className="mt-2 text-sm font-bold underline underline-offset-2">
              프로필 이미지
            </p>
            <p className="mt-1 text-[11px] text-subtle">선택 사항 · 최대 5MB</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              aria-label="프로필 이미지 파일"
              onChange={upload}
              className="sr-only"
            />
            <p role="status" className="mt-2 text-xs text-muted">
              {isReading ? "이미지를 읽는 중이에요." : ""}
            </p>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
          <div className="grid gap-5">
            <AuthField
              id="edit-nickname"
              label="닉네임"
              disabled={isChecking}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setCheckedNickname(null);
              }}
              error={
                !isValidNickname(nickname)
                  ? "닉네임은 2~12자로 입력해 주세요."
                  : undefined
              }
              action={
                <button
                  type="button"
                  onClick={() => void check()}
                  disabled={!isValidNickname(nickname) || isChecking}
                  className="text-xs font-bold text-primary disabled:opacity-40"
                >
                  {isChecking
                    ? "확인 중"
                    : checkedNickname === nickname.trim()
                      ? "확인 완료"
                      : "중복 확인"}
                </button>
              }
            />
            <AuthField
              id="edit-email"
              label="이메일"
              value={profile.email}
              readOnly
            />
          </div>
        </div>
        <section
          aria-label="회원 탈퇴"
          className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-red-500 bg-red-500/10 p-5 text-red-500 min-[801px]:mt-auto"
        >
          <div>
            <h2 className="text-sm font-bold">회원 탈퇴</h2>
            <p className="mt-1 text-[11px]">
              탈퇴하면 작성한 평점, 후기와 즐겨찾기가 모두 삭제되며 복구할 수
              없습니다.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="min-h-10 rounded-lg border border-red-500 bg-white px-4 text-sm font-bold disabled:cursor-not-allowed"
          >
            회원 탈퇴
          </button>
        </section>
      </form>
    </main>
  );
}
