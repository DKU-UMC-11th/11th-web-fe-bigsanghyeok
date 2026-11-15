import { createContext, useContext, useState, type ReactNode } from "react";
export interface Profile {
  nickname: string;
  email: string;
  image: string | null;
}
const initialProfile: Profile = {
  nickname: "gs0428",
  email: "gwangsoo@cinemalab.kr",
  image: null,
};
const ProfileContext = createContext<{
  profile: Profile;
  updateProfile: (value: Pick<Profile, "nickname" | "image">) => void;
} | null>(null);
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile: (value) =>
          setProfile((current) => ({ ...current, ...value })),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("ProfileProvider가 필요해요.");
  return value;
}
export function ProfileAvatar({ image }: { image: string | null }) {
  return image ? (
    <img
      src={image}
      alt="프로필 이미지"
      className="size-[82px] rounded-full object-cover"
    />
  ) : (
    <span className="grid size-[82px] place-items-center rounded-full bg-[#e3e6eb]">
      <img
        src="/icons/person.svg"
        alt="기본 프로필 이미지"
        width="24"
        height="24"
      />
    </span>
  );
}
