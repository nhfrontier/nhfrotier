const { TopBar, Button, AICard, CommentCard, Badge } = window.NHDesignSystem_dafb17;

const QUEUE = [
  {type:"ai",kind:"책임성 검토",axis:"금융소비자보호",where:"화면 3 · 수수료 안내",compliance:true,
   quote:"중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다.",
   reason:'불리한 조건을 "있을 수 있습니다"로만 적어, 고객이 실제로 무엇을 얼마나 손해 보는지 알 수 없습니다.',
   suggestion:"중도해지 금리를 숫자로 적고, 수수료가 없으면 없다고 명시합니다."},
  {type:"human",author:"박선영",pin:1,where:"약관 동의",
   body:"필수인지 선택인지 구분이 안 돼요. 다 눌러야 하는 건지 모르겠습니다."},
  {type:"ai",kind:"UX 리스크 검토",axis:"다크패턴",where:"화면 3 · 다음 버튼",compliance:false,
   quote:"다음",
   reason:"약관을 다 읽지 않아도 다음으로 넘어가지는데, 무엇에 동의한 것인지 확인하는 자리가 없습니다.",
   suggestion:'버튼 문구를 "신청하기"로 바꾸고 동의 항목 수를 버튼 위에 표시합니다.'}
];

/** 한 장씩 결정하기 — 한 화면에 한 장만 둔다. 목록으로 늘어놓으면 무엇을 처리했는지 놓친다. */
function DecideScreen({go}){
  const [i,setI] = React.useState(0);
  const [done,setDone] = React.useState([]);
  const total = 11;
  const item = QUEUE[i % QUEUE.length];
  const decide = (d) => { setDone([...done,d]); setI(i+1); };
  React.useEffect(()=>{
    const onKey = e => { if(["1","2","3","4"].includes(e.key)) decide(["반영","보류","반려","준법 검토 요청"][Number(e.key)-1]); };
    window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey);
  });
  const progress = Math.min(done.length/total,1);

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--surface-canvas)"}}>
      <TopBar title="한 장씩 결정하기" logoSrc="../../assets/nh-symbol-bank.jpg"
        status={`${total}개 중 ${Math.min(done.length+1,total)}번째`} statusTone="info"
        note="나가도 여기까지 저장됩니다"
        right={<Button size="sm" onClick={()=>go("workspace")}>나중에</Button>} />
      <div style={{height:3,background:"var(--ink-100)"}}>
        <div style={{height:"100%",width:`${progress*100}%`,background:"var(--nh-blue)",transition:"width var(--dur-calm) var(--ease-out)"}} />
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"var(--sp-10)",position:"relative"}}>
        {done.length>=total ? (
          <div style={{textAlign:"center",maxWidth:460}}>
            <h1 style={{marginBottom:8}}>11개 다 결정했습니다</h1>
            <p style={{color:"var(--text-muted)",marginBottom:"var(--sp-6)"}}>
              반영한 의견으로 5번째 판을 만들 수 있습니다. 보류한 것은 이유가 함께 남아 있어, 다음에 왜 안 했는지 다시 묻지 않게 됩니다.
            </p>
            <Button tone="primary" size="lg" onClick={()=>go("changes")}>반영해서 새 판 만들기</Button>
          </div>
        ) : (
          <div style={{width:"100%",maxWidth:660,position:"relative"}}>
            <div style={{position:"absolute",top:-8,left:14,right:14,height:20,background:"var(--white)",border:"1px solid var(--border-hairline)",borderRadius:"var(--r-card)",zIndex:0}} />
            <div style={{position:"relative",zIndex:1,boxShadow:"var(--sh-raised)",borderRadius:"var(--r-card)"}}>
              {item.type==="ai"
                ? <AICard {...item} onDecide={decide} />
                : <div style={{background:"var(--surface-card)",border:"1px solid var(--border-hairline)",borderRadius:"var(--r-card)",padding:"var(--pad-card)",display:"flex",flexDirection:"column",gap:"var(--sp-4)"}}>
                    <CommentCard author={item.author} pin={item.pin} where={item.where} body={item.body} style={{border:"none",padding:0}} />
                    <div style={{display:"flex",gap:"var(--gap-inline)"}}>
                      <Button tone="primary" shortcut={1} onClick={()=>decide("반영")}>반영</Button>
                      <Button shortcut={2} onClick={()=>decide("보류")}>보류</Button>
                      <Button shortcut={3} onClick={()=>decide("반려")}>반려</Button>
                    </div>
                    <p style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>↩ 되돌리기는 언제든 됩니다</p>
                  </div>}
            </div>
          </div>
        )}
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-5) var(--pad-page)",display:"flex",alignItems:"center"}}>
        <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>한 화면에 한 장만 둡니다. 목록으로 늘어놓으면 어느 것을 처리했는지 놓칩니다.</p>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {[1,2,3].map(n=><Badge key={n} tone="neutral">{n}</Badge>)}
          <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>키로도 됩니다</span>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { DecideScreen });
