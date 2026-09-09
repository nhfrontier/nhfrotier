const { TopBar, Button, Card, Badge, Avatar, Field, Chip, Icon } = window.NHDesignSystem_dafb17;

const CANDIDATES = [
  {name:"이준호",dept:"채널개발팀",role:"개발 담당자",ask:"구현할 수 있는지, 빠진 상태가 없는지"},
  {name:"박선영",dept:"수신상품부",role:"현업 담당자",ask:"고객이 이해할 수 있는지"},
  {name:"최지우",dept:"준법감시부",role:"준법 담당자",ask:"넘겨받은 지적만 봅니다"},
  {name:"정하윤",dept:"디지털기획팀",role:"기획 담당자",ask:"함께 만들고 결정까지"}
];

/** 검토자 초대·알림 — 누구에게 무엇을 물어보는지 문장으로 확인시키는 화면. */
function InviteScreen({go}){
  const [picked,setPicked] = React.useState(["이준호","박선영"]);
  const [scope,setScope] = React.useState("화면 8개 전부");
  const [due,setDue] = React.useState("9월 12일");
  const toggle = n => setPicked(picked.includes(n) ? picked.filter(x=>x!==n) : [...picked,n]);

  return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)",display:"flex",flexDirection:"column"}}>
      <TopBar title="비대면 계좌 신청 개선" crumb="검토자 초대" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="초대는 나중에 늘릴 수 있습니다"
        right={<Button size="sm" onClick={()=>go("workspace")}>건너뛰기</Button>} />

      <div style={{flex:1,display:"flex",minHeight:0,maxWidth:"var(--content-max)",width:"100%",margin:"0 auto",gap:"var(--sp-8)",padding:"var(--sp-10) var(--pad-page)"}}>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:"var(--sp-6)"}}>
          <div>
            <h1 style={{marginBottom:6}}>누구에게 물어볼까요</h1>
            <p style={{color:"var(--text-muted)"}}>
              사람마다 물어보는 것이 다릅니다. 개발 담당자에게는 "구현할 수 있는지", 현업 담당자에게는 "고객이 이해하는지"를 묻습니다. 알림 문구에 그 말이 그대로 들어갑니다.
            </p>
          </div>

          <Field label="이름이나 부서로 찾기" placeholder="예: 채널개발팀" />

          <div style={{display:"flex",flexDirection:"column",gap:"var(--sp-2)"}}>
            {CANDIDATES.map((c,i)=>{
              const on = picked.includes(c.name);
              return (
                <button key={c.name} type="button" onClick={()=>toggle(c.name)} style={{
                  display:"flex",alignItems:"center",gap:"var(--sp-3)",padding:"var(--sp-4)",cursor:"pointer",textAlign:"left",
                  borderRadius:"var(--r-card)",transition:"var(--transition-control)",
                  background:on?"var(--blue-50)":"var(--white)",
                  border:on?"var(--bw-emphasis) solid var(--nh-blue)":"1px solid var(--border-default)"
                }}>
                  <Avatar name={c.name} index={i} />
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>{c.name}</span>
                      <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>{c.dept}</span>
                      <Badge tone={on?"info":"neutral"}>{c.role}</Badge>
                    </div>
                    <p style={{font:"var(--type-caption)",color:"var(--text-muted)",marginTop:3}}>물어볼 것 — {c.ask}</p>
                  </div>
                  {on ? <Icon name="check" size={16} color="var(--nh-blue)" /> : <Icon name="plus" size={16} color="var(--ink-300)" />}
                </button>
              );
            })}
          </div>

          <Card>
            <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-3)"}}>어디까지 보여줄까요</p>
            <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap",marginBottom:"var(--sp-5)"}}>
              {["화면 8개 전부","약관·수수료 화면만","지금 보고 있는 화면만"].map(s=>
                <Chip key={s} selected={scope===s} onClick={()=>setScope(s)}>{s}</Chip>)}
            </div>
            <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-3)"}}>언제까지</p>
            <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap"}}>
              {["9월 12일","9월 19일","정하지 않음"].map(d=>
                <Chip key={d} selected={due===d} onClick={()=>setDue(d)}>{d}</Chip>)}
            </div>
          </Card>
        </div>

        <aside style={{width:340,flexShrink:0,display:"flex",flexDirection:"column",gap:"var(--sp-4)"}}>
          <div>
            <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-3)"}}>이렇게 알림이 갑니다</p>
            <Card style={{padding:"var(--sp-4)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"var(--sp-3)",paddingBottom:"var(--sp-3)",borderBottom:"1px solid var(--border-hairline)"}}>
                <span style={{width:24,height:24,borderRadius:"var(--r-xs)",background:"var(--white)",border:"1px solid var(--border-default)",display:"flex",alignItems:"center",justifyContent:"center",font:"var(--type-caption)",fontWeight:800,color:"var(--nh-blue)"}}>NH</span>
                <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>위드캔버스 · 사내 메신저</span>
              </div>
              <p style={{font:"var(--type-body)",fontSize:"var(--fs-body-sm)",color:"var(--text-body)",lineHeight:1.7}}>
                김민준님이 <b>비대면 계좌 신청 개선</b> 검토를 부탁했습니다.<br/><br/>
                볼 것은 {scope}입니다. <b>구현할 수 있는지, 빠진 상태가 없는지</b> 어색한 곳을 눌러 한 줄 남겨주시면 됩니다.
                디자인 용어는 몰라도 됩니다.<br/><br/>
                <span style={{color:"var(--text-muted)"}}>{due}까지 · 약 10분 걸립니다</span>
              </p>
              <Button tone="primary" fullWidth style={{marginTop:"var(--sp-4)"}} onClick={()=>go("reviewer")}>열어보기</Button>
            </Card>
          </div>

          <Card surface="quiet">
            <p style={{font:"var(--type-caption)",color:"var(--text-muted)",lineHeight:1.7}}>
              마감 하루 전에 아직 열어보지 않은 사람에게만 한 번 더 갑니다. 전체에게 반복해서 보내지 않습니다.
            </p>
          </Card>
        </aside>
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-5) var(--pad-page)",display:"flex",alignItems:"center"}}>
        <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>{picked.length}명에게 보냅니다 · {scope} · {due}까지</p>
        <Button tone="primary" size="lg" style={{marginLeft:"auto"}} onClick={()=>go("workspace")}>초대 보내기</Button>
      </div>
    </div>
  );
}
Object.assign(window, { InviteScreen });
