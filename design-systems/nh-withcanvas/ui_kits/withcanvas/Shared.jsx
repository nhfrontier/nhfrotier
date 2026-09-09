const { Artboard, ArtboardStage, Pin, Badge } = window.NHDesignSystem_dafb17;

const cell = {padding:"12px 14px",fontSize:"var(--fs-body-sm)",color:"var(--ink-700)"};

/** 목업 안에 들어가는 가짜 앱 화면 — 비대면 계좌 신청. 실제 제품에서는 샌드박스 iframe. */
function AccountMock({fixed=false,pins=true,mode="pick"}){
  return (
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:12,background:"var(--white)",flex:1}}>
      <div style={{border:"1px solid var(--border-hairline)",borderRadius:8}}>
        <div style={{...cell,borderBottom:"1px solid var(--border-hairline)"}}>
          <span style={{fontSize:12,color:"var(--text-faint)"}}>신청 상품</span><br/>
          <b style={{color:"var(--ink-900)",fontSize:16}}>NH 주거래우대 통장</b>
        </div>
        <div style={{...cell,display:"flex",justifyContent:"space-between"}}><span>기본 금리</span><b>연 2.1%</b></div>
      </div>

      <Pin number={pins?1:null} state={pins?"open":"none"} label="약관 동의 영역">
        <div style={{padding:12}}>
          <b style={{font:"var(--type-label)",color:"var(--ink-900)"}}>약관 동의</b>
          {[["예금거래기본약관",fixed&&"필수"],["개인정보 수집·이용 동의",fixed&&"필수"],["전자금융거래 이용약관",fixed&&"선택"]].map(([t,tag])=>
            <div key={t} style={{display:"flex",gap:8,alignItems:"center",marginTop:9,fontSize:13,color:"var(--ink-700)"}}>
              <span style={{width:15,height:15,border:"1.5px solid var(--border-strong)",borderRadius:3,flexShrink:0}} />
              {tag ? <span style={{font:"var(--type-caption)",fontWeight:800,color:tag==="필수"?"var(--nh-blue)":"var(--ink-500)"}}>[{tag}]</span> : null}
              {t}
            </div>)}
        </div>
      </Pin>

      <Pin number={pins?2:null} state={fixed?"decided":(pins?"unresolved":"none")} label="수수료 안내">
        <p style={{padding:12,fontSize:12.5,color:"var(--ink-600)",lineHeight:1.6}}>
          {fixed
            ? "중도해지 시 중도해지 금리(연 0.5%)가 적용되며, 별도 수수료는 없습니다."
            : "중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다."}
        </p>
      </Pin>

      <div style={{marginTop:"auto"}}>
        <Pin number={pins?3:null} state={fixed?"decided":(pins?"open":"none")} label="다음 버튼">
          <div style={{margin:2,padding:"14px 0",borderRadius:8,background:"var(--nh-blue)",color:"#fff",textAlign:"center",font:"var(--type-card-title)"}}>
            {fixed ? "신청하기" : "다음"}
          </div>
        </Pin>
      </div>

      <div style={{display:"flex",borderTop:"1px solid var(--border-hairline)",paddingTop:9,marginTop:2}}>
        {["홈","조회","상품","혜택","전체"].map((t,i)=>
          <div key={t} style={{flex:1,textAlign:"center",fontSize:10.5,color:i===2?"var(--nh-blue)":"var(--ink-400)",fontWeight:i===2?800:400}}>
            <span style={{display:"block",width:15,height:15,margin:"0 auto 4px",borderRadius:4,background:i===2?"var(--nh-blue)":"var(--ink-200)"}} />{t}
          </div>)}
      </div>
    </div>
  );
}

/** 우측 패널 껍데기 */
function Panel({title,count,children,footer}){
  return (
    <aside style={{width:"var(--panel-w)",flexShrink:0,background:"var(--surface-card)",borderLeft:"1px solid var(--border-hairline)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"var(--sp-5) var(--pad-panel)",borderBottom:"1px solid var(--border-hairline)",display:"flex",alignItems:"center",gap:8}}>
        <span style={{font:"var(--type-card-title)",color:"var(--text-title)"}}>{title}</span>
        {count!=null ? <Badge tone="neutral">{count}</Badge> : null}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"var(--pad-panel)",display:"flex",flexDirection:"column",gap:"var(--gap-stack)"}}>{children}</div>
      {footer ? <div style={{padding:"var(--sp-4) var(--pad-panel)",borderTop:"1px solid var(--border-hairline)"}}>{footer}</div> : null}
    </aside>
  );
}

Object.assign(window, { AccountMock, Panel });
