import { Flower } from '@prisma/client';

export default function ShareCard({ flower, elementId }: { flower: Flower; elementId: string }) {
  return (
    <div className="fixed top-0 left-[-9999px] z-[-1]">
      <div 
        id={elementId} 
        className="w-[600px] h-[800px] flex flex-col overflow-hidden" 
        style={{ backgroundColor: '#fafaf9' }} 
      >
        {/* 上半部分：图片区 (保持不变) */}
        <div className="w-full h-[600px] relative">
          <img 
            src={flower.imageUrl} 
            alt={flower.name} 
            className="w-full h-full object-cover"
            crossOrigin="anonymous" 
          />
        </div>

        {/* 下半部分：信息区 */}
        <div 
            className="flex-1 p-8 flex flex-col justify-center relative"
            style={{ 
                backgroundColor: '#ffffff',
                borderTop: '4px solid #f5f5f4' 
            }}
        >
          <div className="flex justify-between items-end">
             <div>
                <h2 className="text-5xl font-serif font-bold mb-2" style={{ color: '#1c1917' }}>
                    {flower.name}
                </h2>
                <p className="text-sm tracking-widest uppercase" style={{ color: '#a8a29e' }}>
                    Flower Daily
                </p>
             </div>
             
             <div className="text-right">
                <p className="text-xs mb-1" style={{ color: '#d6d3d1' }}>Scan to collect</p>
                <div className="w-12 h-12 rounded-md" style={{ backgroundColor: '#e7e5e4' }}></div> 
             </div>
          </div>

          <div 
            className="mt-6 pl-4"
            style={{ borderLeft: '4px solid #f472b6' }} 
          >
             {/* =============== 修复重点 =============== 
                放弃 gradient 和 transparent，使用纯色 (#be123c - 玫瑰红)
                这样 html2canvas 截图时一定能看见文字。
             */}
             <p 
               className="text-2xl font-serif italic leading-normal"
               style={{
                 color: '#be123c', // 使用深玫瑰红，既优雅又清晰
                 fontWeight: '500'
               }}
             >
               “{flower.language}”
             </p>
          </div>
          
          <div className="absolute bottom-2 right-4 text-[10px]" style={{ color: '#d6d3d1' }}>
            flower-daily.vercel.app
          </div>
        </div>
      </div>
    </div>
  );
}