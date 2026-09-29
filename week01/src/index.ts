type MemberRole = "leader" | "member";

interface StudyMember {
  id: number;
  name: string;
  role: MemberRole;
  githubId?: string;
}

const members: StudyMember[] = [
  { id: 1, name: "광수", role: "leader", githubId: "gwangsoo" },
  { id: 2, name: "지수", role: "member" },
];

function findMember(memberId: number) {
  return members.find((member) => member.id === memberId);
}

function createMemberMessage(memberId: number) {
  const member = findMember(memberId);

  // 검색 결과가 없으면 여기서 반환해 프로퍼티 접근을 막아요.
  if (!member) {
    return "회원을 찾지 못했어요.";
  }

  const roleMessage =
    member.role === "leader" ? "스터디를 이끌어요." : "스터디에 참여해요.";
  const githubId = member.githubId ?? "등록되지 않음";

  return member.name + " 님, " + roleMessage + " GitHub 아이디: " + githubId;
}

console.log("ID 1: " + createMemberMessage(1));
console.log("ID 2: " + createMemberMessage(2));
console.log("ID 999: " + createMemberMessage(999));
