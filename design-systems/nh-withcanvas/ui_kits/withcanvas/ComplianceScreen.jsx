const { TopBar, Button, Card, Badge, Avatar, Field, Chip, Icon } = window.NHDesignSystem_dafb17;

const HANDOVER = [
  {id:1,project:"비대면 계좌 신청 개선",where:"화면 3 · 수수료 안내",axis:"금융소비자보호",
   quote:"중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다.",
   reason:'불리한 조건을 "있을 수 있습니다"로만 적어, 고객이 실제로 무엇을 얼마나 손해 보는지 알 수 없습니다.',
   from:"김민준",note:"금리 숫자는 상품부 확인이 필요해 저희가 판단하기 어렵습니다.",when:"2시간 전"},
  {id:2,project:"NH 청년 우대 체크카드",where:"시안 2 · 혜택 표기",axis:"표현",
   quote:"최대 5만원 캐시백",
   reason:'"최대"의 조건(전월 실적 30만원 이상)이 같은 화면에 없어 과장 표현이 될 수 있습니다.',
   from:"박준혁",note:"홍보물 문구 규정을 어디까지 적용해야 하는지 확인 부탁드립니다.",when:"어제"}
];

/** 준법 담당자 화면 — 넘겨받은 지적만 보인다. 화면을 만들거나 판을 바꾸는 버튼이 없다. */
function ComplianceScreen({go}){
  const [i,setI] = React.useState(0);
  const [verdict,setVerdict] = React.useState(null);
  const [basis,setBasis] = React.useState("");
  const item = HANDOVER[i];

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--surface-canvas)"}}>
      <TopBar title="준법 검토" logoSrc="../../assets/nh-symbol-bank.jpg" user="최지우"
        status={`넘겨받은 건 ${HANDOVER.length}`} statusTone="warn"
        note="화면을 고치는 권한은 없습니다 — 판단만 남깁니다"
        right={<Button size="sm" onClick={()=>go("list")}>나가기</Button>} />

      <div style={{display:"flex",flex:1,minHeight:0}}>
        <div style={{width:300,flexShrink:0,background:"var(--surface-card)",borderRight:"1px solid var(--border-hairline)",padding:"var(--sp-5)",display:"flex",flexDirection:"column",gap:"var(--sp-2)"}}>
          <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-2)"}}>넘겨받은 지적</p>
          {HANDOVER.map((h,j)=>
            <button key={h.id} type="button" onClick={()=>{setI(j);setVerdict(null)}} style={{
              textAlign:"left",padding:"var(--sp-4)",borderRadius:"var(--r-card)",cursor:"pointer",
              transition:"var(--transition-control)",
              background:i===j?"var(--blue-50)":"var(--white)",
              border:i===j?"var(--bw-emphasis) solid var(--nh-blue)":"1px solid var(--border-default)"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <Badge tone="warn">{h.axis}</Badge>
                <span style={{marginLeft:"auto",font:"var(--type-caption)",color:"var(--text-faint)"}}>{h.when}</span>
              </div>
              <p style={{font:"var(--type-label)",color:"var(--text-title)"}}>{h.project}</p>
              <p style={{font:"var(--type-caption)",color:"var(--text-muted)",marginTop:3}}>{h.where}</p>
            </button>)}
          <Card surface="quiet" style={{marginTop:"auto"}}>
            <p style={{font:"var(--type-caption)",color:"var(--text-muted)",lineHeight:1.7}}>
              담당자가 스스로 판단하지 않고 넘긴 것만 여기 옵니다. AI가 자동으로 넘기지는 않습니다.
            </p>
          </Card>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"var(--sp-10)",display:"flex",justifyContent:"center"}}>
          <div style={{width:"100%",maxWidth:640,display:"flex",flexDirection:"column",gap:"var(--sp-4)"}}>
            <div>
              <h1 style={{marginBottom:6}}>{item.project}</h1>
              <p style={{color:"var(--text-muted)"}}>{item.where} · {item.from}님이 넘김</p>
            </div>

            <Card surface="ai" style={{borderLeft:"var(--bw-accent-edge) solid var(--nh-blue)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"var(--sp-4)"}}>
                <Badge tone="ai">AI</Badge>
                <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>책임성 검토</span>
                <Badge tone="info">{item.axis}</Badge>
              </div>
              <p style={{font:"var(--type-caption)",color:"var(--text-muted)",marginBottom:6}}>화면에 있는 말</p>
              <p style={{fontSize:"var(--fs-body-sm)",color:"var(--ink-700)",borderLeft:"2px solid var(--border-strong)",paddingLeft:12,marginBottom:"var(--sp-4)"}}>{item.quote}</p>
              <p style={{font:"var(--type-caption)",color:"var(--text-muted)",marginBottom:4}}>왜 짚었나</p>
              <p style={{font:"var(--type-body)",fontWeight:700,color:"var(--text-title)"}}>{item.reason}</p>
            </Card>

            <Card>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Avatar name={item.from} size={22} />
                <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>{item.from}님이 남긴 말</span>
              </div>
              <p style={{fontSize:"var(--fs-body-sm)",color:"var(--text-body)"}}>{item.note}</p>
            </Card>

            <Card>
              <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-3)"}}>준법 판단</p>
              <div style={{display:"flex",gap:"var(--gap-inline)",marginBottom:"var(--sp-5)",flexWrap:"wrap"}}>
                {[["적합","ok"],["조건부 적합","warn"],["부적합","danger"]].map(([label,tone])=>
                  <Chip key={label} selected={verdict===label} onClick={()=>setVerdict(label)}>{label}</Chip>)}
              </div>
              <Field multiline rows={3} label="근거 규정과 판단 이유" value={basis} onChange={e=>setBasis(e.target.value)}
                placeholder="예: 금융소비자보호법 제19조 설명의무 — 불리한 조건은 구체적 수치로 표시해야 합니다"
                assist="여기 적은 내용이 그대로 담당자에게 돌아가고, 기록에 남습니다" />
              <div style={{display:"flex",alignItems:"center",gap:"var(--sp-3)",marginTop:"var(--sp-5)"}}>
                <p style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>
                  {verdict ? `"${verdict}"으로 ${item.from}님에게 돌아갑니다` : "판단을 고르면 담당자에게 돌아갑니다"}
                </p>
                <Button tone="primary" size="lg" disabled={!verdict} style={{marginLeft:"auto"}}
                  onClick={()=>{setVerdict(null);setBasis("");setI((i+1)%HANDOVER.length)}}>담당자에게 돌려보내기</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ComplianceScreen });
