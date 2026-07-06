function Link() {
  return (
    <div className="h-[26.997px] relative shrink-0 w-[178.203px]" data-name="Link">
      <div className="[word-break:break-word] bg-clip-padding border-0 border-[transparent] border-solid relative size-full whitespace-nowrap">
        <p className="absolute font-['Archivo:ExtraBold',sans-serif] font-extrabold leading-[27px] left-0 text-[27px] text-white top-0 tracking-[-0.675px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          LexBlog
        </p>
        <p className="absolute font-['Archivo:Regular',sans-serif] font-normal leading-[20px] left-[118.3px] text-[20px] text-[rgba(255,255,255,0.58)] top-[5.56px] tracking-[-0.1px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Library
        </p>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="relative shrink-0" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Archivo:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#a9abb0] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          <span className="leading-[18px]">{`Preservation by LexBlog Library. Publishing by `}</span>
          <span className="leading-[18px] text-[#cfd1d6]">LexBlog.com</span>
          <span className="leading-[18px]">.</span>
        </p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex items-center justify-between max-w-[1320px] px-[28px] py-[34px] relative shrink-0 w-[1320px]" data-name="Container">
      <Link />
      <Paragraph />
    </div>
  );
}

function ContainerMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <Container />
      </div>
    </div>
  );
}

function MiniFooter() {
  return (
    <div className="bg-[#0a0a0b] relative shrink-0 w-full" data-name="MiniFooter">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <ContainerMargin />
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="h-[805.556px] relative shrink-0 w-full" data-name="App">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-end relative size-full">
        <MiniFooter />
      </div>
    </div>
  );
}

export default function GlobalFooter() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Global Footer">
      <App />
    </div>
  );
}