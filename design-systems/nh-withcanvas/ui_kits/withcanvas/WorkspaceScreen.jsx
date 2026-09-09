const { TopBar, StepTrail, ModeToggle, Filmstrip, Button, Badge, Field,
        Artboard, ArtboardStage, AICard, CommentCard, Icon } = window.NHDesignSystem_dafb17;

/** 워크스페이스 = 캔버스 하나 + 협업 패널 하나. 탭을 다섯 개 만들지 않는다. */
function WorkspaceScreen({go}){
  const [mode,setMode] = React.useState("pick");
  const [screen,setScreen] = React.useState(2);
  const [aiDecision,setAiDecision] = React.useState(null);
  const [asked,setAsked] = React.useState(true);
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--surface-canvas)"}}>
      <TopBar title="고객 포털 리뉴얼" status="의견 모으는 중" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        right={<>
          <Button size="sm" onClick={()=>go("changes")}>4번째 판</Button>
          <Button size="sm">기록</Button>
          <Button size="sm">내려받기</Button>
        </>} />
      <StepTrail steps={["자료 준비","초안 만들기","의견 모으기","반영해서 새 판","마무리"]} current={2}
        note="결정하지 않은 의견 11개" />

      <div style={{display:"flex",flex:1,minHeight:0}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:"var(--sp-4) var(--sp-6)",background:"var(--surface-card)",borderBottom:"1px solid var(--border-hairline)",display:"flex",alignItems:"center",gap:"var(--sp-4)"}}>
            <ModeToggle value={mode} onChange={setMode} note="모드는 이 두 개뿐입니다"
              options={[{value:"view",label:"보기",icon:"eye"},{value:"pick",label:"짚기",icon:"hand"}]} />
            <span style={{marginLeft:"auto",font:"var(--type-caption)",color:"var(--text-faint)"}}>
              {mode==="pick" ? "화면에서 어색한 곳을 손가락으로 짚듯 눌러주세요" : "목업 안 버튼을 누르면 다음 화면으로 넘어갑니다"}
            </span>
          </div>

          <ArtboardStage>
            <Artboard kind="mobile" width={300} height={560} title="비대면 계좌 신청" picking={mode==="pick"}>
              <AccountMock />
            </Artboard>
          </ArtboardStage>

          <Filmstrip current={screen} onSelect={setScreen}
            items={[{},{},{},{},{},{state:"waiting"},{state:"failed"},{}]}
            right={<>
              <Button size="sm" onClick={()=>setScreen(Math.max(0,screen-1))}>이전 화면</Button>
              <Button size="sm" onClick={()=>setScreen(Math.min(7,screen+1))}>다음 화면</Button>
            </>} />
        </div>

        <Panel title="남긴 의견" count={3}
          footer={<Button tone="primary" fullWidth size="lg" onClick={()=>go("decide")}>의견 11개 한 장씩 결정하기</Button>}>
          <div style={{background:"var(--ink-50)",borderRadius:"var(--r-sm)",padding:"var(--sp-4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Icon name="hand" size={14} color="var(--nh-blue)" />
              <span style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>짚은 곳</span>
              <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>약관 동의 영역</span>
            </div>
            <Field multiline rows={2} placeholder="무엇이 이해되지 않았는지 그대로 적어주세요" assist="디자인 용어는 몰라도 됩니다" />
            <div style={{display:"flex",gap:"var(--gap-inline)",marginTop:"var(--sp-3)"}}>
              <Button size="sm" style={{flex:1}}><Icon name="mic" size={14} />말로 하기</Button>
              <Button size="sm" style={{flex:1}}><Icon name="image-plus" size={14} />사진 붙이기</Button>
            </div>
          </div>

          <CommentCard author="박선영" pin={1} where="약관 동의" body="필수인지 선택인지 구분이 안 돼요. 다 눌러야 하는 건지 모르겠습니다." time="41분 전" />
          <CommentCard author="이준호" pin={2} where="수수료 안내" body={'"발생할 수 있습니다"만 있고 얼마인지가 없어서 고객이 다시 물어볼 것 같습니다.'} time="28분 전" />

          {asked ? (
            <AICard kind="누적 점검" where="이 화면" decision={aiDecision} onDecide={setAiDecision}
              reason="의견 두 개를 다 반영하면 이 화면에 안내 문구가 3개가 됩니다. 다음 버튼이 접힘 아래로 내려갑니다."
              suggestion="수수료 안내를 접었다 펴는 형태로 바꾸고, 다음 버튼을 화면에 고정합니다." />
          ) : (
            <Button fullWidth onClick={()=>setAsked(true)}><Icon name="sparkles" size={15} />AI에게 검토 요청</Button>
          )}
        </Panel>
      </div>
    </div>
  );
}
Object.assign(window, { WorkspaceScreen });
