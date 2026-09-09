const { TopBar, StepTrail, Button, Card, Badge, Icon } = window.NHDesignSystem_dafb17;

const FILES = [
  {name:"비대면계좌_기획서_v3.docx",size:"1.2MB",who:"김민준",when:"방금",read:true,note:"AI가 화면 요건을 여기서 읽습니다"},
  {name:"화면정의서_계좌개설.xlsx",size:"480KB",who:"김민준",when:"방금",read:true,note:"화면 목록과 항목명을 여기서 읽습니다"},
  {name:"계좌개설_API명세_v2.md",size:"64KB",who:"이준호",when:"12분 전",read:true,note:"개발 담당자가 올림 · 응답 항목을 화면과 맞춥니다"},
  {name:"약관_전문_2026.pdf",size:"3.4MB",who:"최지우",when:"1시간 전",read:false,note:"분량이 커서 읽기에서 빼두었습니다"}
];

/** 참고자료 업로드 — AI가 무엇을 읽고 만드는지 사용자가 통제하는 자리. */
function FilesScreen({go}){
  const [files,setFiles] = React.useState(FILES);
  const [over,setOver] = React.useState(false);
  const toggle = i => setFiles(files.map((f,j)=>j===i?{...f,read:!f.read}:f));
  const reading = files.filter(f=>f.read).length;

  return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)",display:"flex",flexDirection:"column"}}>
      <TopBar title="비대면 계좌 신청 개선" crumb="참고자료" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="올린 자료는 이 작업 안에만 있습니다"
        right={<Button size="sm" onClick={()=>go("invite")}>검토자 초대</Button>} />
      <StepTrail steps={["자료 준비","초안 만들기","의견 모으기","반영해서 새 판","마무리"]} current={0}
        note={`AI가 읽을 자료 ${reading}개`} />

      <div style={{flex:1,maxWidth:"var(--content-max)",width:"100%",margin:"0 auto",padding:"var(--sp-10) var(--pad-page)",display:"flex",flexDirection:"column",gap:"var(--sp-6)"}}>
        <div>
          <h1 style={{marginBottom:6}}>무엇을 보고 만들까요</h1>
          <p style={{color:"var(--text-muted)"}}>
            기획서·화면정의서·API 명세를 올리면 AI가 그것부터 읽습니다. 올리지 않아도 만들 수는 있지만, 그러면 이 업무의 맥락 없이 일반적인 화면이 나옵니다.
          </p>
        </div>

        <div onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false)}}
          style={{
            border:`1.5px dashed ${over?"var(--nh-blue)":"var(--border-strong)"}`,borderRadius:"var(--r-lg)",
            background:over?"var(--pick-fill)":"var(--white)",padding:"var(--sp-10)",textAlign:"center",
            transition:"var(--transition-control)"
          }}>
          <Icon name="upload" size={22} color="var(--ink-400)" />
          <p style={{font:"var(--type-card-title)",color:"var(--text-title)",margin:"var(--sp-3) 0 4px"}}>여기로 끌어다 놓으세요</p>
          <p style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>hwp · docx · xlsx · pdf · md · png · 한 개 50MB까지</p>
          <Button style={{marginTop:"var(--sp-4)"}}>파일 고르기</Button>
        </div>

        <div>
          <div style={{display:"flex",alignItems:"center",marginBottom:"var(--sp-3)"}}>
            <h2>올린 자료 {files.length}개</h2>
            <span style={{marginLeft:"auto",font:"var(--type-caption)",color:"var(--text-faint)"}}>
              오른쪽 스위치를 끄면 그 자료는 AI가 읽지 않습니다
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"var(--sp-2)"}}>
            {files.map((f,i)=>
              <Card key={f.name} style={{display:"flex",alignItems:"center",gap:"var(--sp-4)",padding:"var(--sp-4) var(--sp-5)"}}>
                <Icon name="file-text" size={18} color="var(--ink-400)" />
                <div style={{minWidth:0,flex:1}}>
                  <p style={{font:"var(--type-label)",color:"var(--text-title)"}}>{f.name}</p>
                  <p style={{font:"var(--type-caption)",color:"var(--text-faint)",marginTop:2}}>{f.size} · {f.who}님이 {f.when} 올림 · {f.note}</p>
                </div>
                <Badge tone={f.read?"ok":"neutral"}>{f.read?"AI가 읽습니다":"읽지 않습니다"}</Badge>
                <button type="button" onClick={()=>toggle(i)} aria-pressed={f.read} style={{
                  width:40,height:24,borderRadius:"var(--r-pill)",border:"none",cursor:"pointer",position:"relative",
                  background:f.read?"var(--nh-blue)":"var(--ink-200)",transition:"var(--transition-control)"
                }}>
                  <span style={{position:"absolute",top:3,left:f.read?19:3,width:18,height:18,borderRadius:"var(--r-pill)",background:"#fff",transition:`left var(--dur-instant) var(--ease-out)`}} />
                </button>
              </Card>)}
          </div>
        </div>

        <Card surface="quiet" style={{display:"flex",gap:"var(--sp-4)",alignItems:"center"}}>
          <Icon name="shield" size={18} color="var(--ink-400)" />
          <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>
            올린 자료는 이 작업에 초대된 사람만 볼 수 있고, 외부로 나가지 않습니다. 고객 실명·계좌번호가 들어간 파일은 올리지 마세요.
          </p>
        </Card>
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-5) var(--pad-page)",display:"flex",alignItems:"center"}}>
        <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>자료 {reading}개를 읽고 화면 초안을 만듭니다. 만든 뒤에도 자료를 더 올릴 수 있습니다.</p>
        <div style={{marginLeft:"auto",display:"flex",gap:"var(--gap-inline)"}}>
          <Button size="lg" onClick={()=>go("new")}>이전</Button>
          <Button tone="primary" size="lg" onClick={()=>go("newtask")}>이 자료로 초안 만들기</Button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { FilesScreen });
