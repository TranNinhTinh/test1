import Image from 'next/image'

export default function ThoTotLogo({ className = "w-48" }: { className?: string }) {
  return (
    <div className={className}>
      <Image 
        src="/logo.png" 
        alt="Thợ Tốt Logo" 
        width={680} 
        height={540}
        className="w-full h-auto object-contain"
        priority
        style={{ padding: '0' }}
      />
    </div>
  )
}
