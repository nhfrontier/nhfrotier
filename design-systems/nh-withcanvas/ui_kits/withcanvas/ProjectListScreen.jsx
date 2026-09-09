const { TopBar, TaskBanner, ProjectRow, Button, Card, Icon } = window.NHDesignSystem_dafb17;

/** 홈 = 프로젝트 목록. 대시보드 카드 여섯 장 대신 "지금 할 일" 한 줄 + 목록 하나. */
function ProjectListScreen({go,role,onRole}){
  return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)"}}>
      <TopBar title="위드캔버스" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note={role==="maker"?"만드는 사람으로 보고 있습니다":"의견 주는 사람으로 보고 있습니다"}
        right={<Button size="sm" onClick={onRole}>{role==="maker"?"참여자 화면 보기":"담당자 화면 보기"}</Button>} />

      <div style={{maxWidth:"var(--content-max)",margin:"0 auto",padding:"var(--sp-10) var(--pad-page) var(--sp-16)",display:"flex",flexDirection:"column",gap:"var(--gap-section)"}}>
        <TaskBanner headline="검토자 3명 중 2명이 의견을 남겼습니다. 결정하지 않은 의견이 11개 있습니다."
          detail="고객 포털 리뉴얼 · 이준호님은 아직 열어보지 않았습니다 · 마감까지 4일"
          secondaryLabel="이준호님께 다시 알리기"
          primaryLabel="의견 11개 한 장씩 결정하기" onPrimary={()=>go("decide")} />

        <div>
          <div style={{display:"flex",alignItems:"center",marginBottom:"var(--sp-4)"}}>
            <h2>내가 맡은 일</h2>
            <Button tone="primary" style={{marginLeft:"auto"}} onClick={()=>go("new")}>
              <Icon name="plus" size={16} />새 프로젝트
            </Button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"var(--gap-stack)"}}>
            <ProjectRow name="고객 포털 리뉴얼" status="의견 모으는 중" statusTone="info"
              next="결정하지 않은 의견 11개 · 검토자 3명 중 2명 응답" people={["김민준","박선영","이준호"]} when="10분 전"
              onClick={()=>go("workspace")} />
            <ProjectRow name="모바일뱅킹 온보딩" status="반영해서 새 판" statusTone="warn"
              next="반영한 의견 3개로 5번째 판을 만드는 중입니다" people={["이서연","김민준"]} when="1시간 전"
              onClick={()=>go("workspace")} />
            <ProjectRow name="NH 청년 우대 체크카드" status="방향 고르는 중" statusTone="info"
              next="시안 3안이 나왔습니다. 한 방향을 고르면 첫 판이 만들어집니다" people={["김민준","박준혁"]} when="방금"
              onClick={()=>go("workspace")} />
            <ProjectRow name="지점 안내 리플렛" status="초안 실패" statusTone="danger"
              next="AI 응답이 늦어 초안이 만들어지지 않았습니다. 입력한 내용은 그대로 있습니다" people={["박준혁"]} when="2시간 전"
              onClick={()=>go("newtask")} />
          </div>
        </div>

        <Card surface="quiet" style={{display:"flex",alignItems:"center",gap:"var(--sp-4)"}}>
          <Icon name="info" size={18} color="var(--ink-400)" />
          <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>
            끝난 작업 12개는 목록에서 내려두었습니다. 필요할 때 검색으로 찾습니다 — 홈에는 지금 손이 필요한 것만 둡니다.
          </p>
          <Button size="sm" style={{marginLeft:"auto",flexShrink:0}} onClick={()=>go("compliance")}>준법 검토 화면</Button>
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { ProjectListScreen });
