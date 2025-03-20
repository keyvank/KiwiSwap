"use client"

import { useEffect, useState } from "react"

interface KiwiProps {
  id: number
  x: number
  y: number
  size: number
  speed: number
  direction: number
}

export function AnimatedBackground() {
  const [kiwis, setKiwis] = useState<KiwiProps[]>([])

  useEffect(() => {
    // تولید 10 کیوی با مشخصات تصادفی
    const newKiwis: KiwiProps[] = []
    for (let i = 0; i < 10; i++) {
      newKiwis.push({
        id: i,
        x: Math.random() * 100, // درصد از عرض صفحه
        y: Math.random() * 100, // درصد از ارتفاع صفحه
        size: Math.random() * 30 + 20, // اندازه بین 20 تا 50 پیکسل
        speed: Math.random() * 10 + 5, // سرعت بین 5 تا 15 ثانیه برای یک حرکت کامل
        direction: Math.random() * 360, // جهت حرکت (درجه)
      })
    }
    setKiwis(newKiwis)

    // تابع برای حرکت دادن کیوی‌ها
    const moveKiwis = () => {
      setKiwis((prevKiwis) =>
        prevKiwis.map((kiwi) => {
          // محاسبه موقعیت جدید با توجه به جهت حرکت
          const radians = kiwi.direction * (Math.PI / 180)
          let newX = kiwi.x + Math.cos(radians) * 0.2
          let newY = kiwi.y + Math.sin(radians) * 0.2
          let newDirection = kiwi.direction

          // بررسی برخورد با لبه‌های صفحه و تغییر جهت
          if (newX < 0 || newX > 100) {
            newDirection = 180 - newDirection
            newX = Math.max(0, Math.min(100, newX))
          }
          if (newY < 0 || newY > 100) {
            newDirection = 360 - newDirection
            newY = Math.max(0, Math.min(100, newY))
          }

          // اضافه کردن کمی تصادفی بودن به حرکت
          newDirection += (Math.random() - 0.5) * 10

          return {
            ...kiwi,
            x: newX,
            y: newY,
            direction: newDirection,
          }
        }),
      )
    }

    // حرکت دادن کیوی‌ها هر 50 میلی‌ثانیه
    const interval = setInterval(moveKiwis, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* لایه تار برای پس‌زمینه */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md"></div>

      {/* کیوی‌های متحرک */}
      {kiwis.map((kiwi) => (
        <div
          key={kiwi.id}
          className="absolute select-none pointer-events-none text-primary/10"
          style={{
            left: `${kiwi.x}%`,
            top: `${kiwi.y}%`,
            fontSize: `${kiwi.size}px`,
            transition: `all ${kiwi.speed / 20}s ease-in-out`,
            transform: `rotate(${kiwi.direction}deg)`,
          }}
        >
          🥝
        </div>
      ))}
    </div>
  )
}

