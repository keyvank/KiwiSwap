import { AnimatedBackground } from "@/components/animated-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Code, Coins, ExternalLink, Globe, Shield, Users } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 pt-8">
      <AnimatedBackground />
      <div className="z-10 w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">درباره کیوی‌سواپ</h1>

        <div className="space-y-8" dir="rtl">
          {/* About KiwiSwap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Globe className="ml-2 h-5 w-5 text-primary" />
                معرفی کیوی‌سواپ
              </CardTitle>
              <CardDescription>صرافی غیرمتمرکز مبتنی بر فرمول CPMM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                کیوی‌سواپ یک صرافی غیرمتمرکز (DEX) است که بر روی شبکه زنجیر فعالیت می‌کند. این پلتفرم با استفاده از
                مکانیزم بازارساز ثابت محصول (CPMM) به کاربران امکان می‌دهد تا به صورت غیرمتمرکز و بدون نیاز به واسطه،
                توکن‌های خود را مبادله کنند.
              </p>
              <p>
                با استفاده از کیوی‌سواپ، کاربران می‌توانند به راحتی توکن‌های مختلف را مبادله کنند، به استخرهای نقدینگی
                اضافه کنند و از پاداش‌های ارائه نقدینگی بهره‌مند شوند. تمامی تراکنش‌ها به صورت شفاف و امن بر روی بلاکچین
                ثبت می‌شوند.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-secondary/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <Coins className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">مبادله آسان</h3>
                  <p className="text-sm text-muted-foreground">مبادله سریع و آسان انواع توکن‌ها با کمترین کارمزد</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <Shield className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">امنیت بالا</h3>
                  <p className="text-sm text-muted-foreground">تراکنش‌های امن و شفاف بر بستر بلاکچین</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <Code className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-medium mb-1">متن‌باز</h3>
                  <p className="text-sm text-muted-foreground">کد منبع باز و قابل بررسی توسط جامعه</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Users className="ml-2 h-5 w-5 text-primary" />
                تیم کیوی‌سواپ
              </CardTitle>
              <CardDescription>متخصصان حوزه بلاکچین و فناوری‌های نوین</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تیم کیوی‌سواپ متشکل از متخصصان با تجربه در حوزه‌های بلاکچین، امنیت سایبری، توسعه نرم‌افزار و اقتصاد است. ما
                با هدف ایجاد یک اکوسیستم مالی غیرمتمرکز، امن و کاربرپسند گرد هم آمده‌ایم.
              </p>
              <p>
                ما معتقدیم که آینده مالی در دستان فناوری‌های غیرمتمرکز است و تلاش می‌کنیم تا با ارائه راهکارهای نوآورانه،
                دسترسی به این فناوری‌ها را برای همگان آسان‌تر کنیم.
              </p>
            </CardContent>
          </Card>

          {/* Job Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Briefcase className="ml-2 h-5 w-5 text-primary" />
                موقعیت‌های شغلی
              </CardTitle>
              <CardDescription>به تیم ما بپیوندید</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                ما همواره به دنبال افراد با استعداد و علاقه‌مند به فناوری‌های نوین هستیم. اگر شما نیز به دنبال چالش‌های
                جدید در حوزه بلاکچین و فناوری‌های غیرمتمرکز هستید، می‌توانید به تیم ما بپیوندید.
              </p>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">مدیر فنی (Technical Lead)</CardTitle>
                  <CardDescription>تمام وقت / امکان دورکاری</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">شرح موقعیت:</h4>
                    <p className="text-sm">
                      ما به دنبال یک مدیر فنی با تجربه در حوزه بلاکچین و توسعه قراردادهای هوشمند هستیم. در این نقش، شما
                      مسئولیت هدایت تیم فنی، طراحی معماری سیستم، و توسعه قراردادهای هوشمند را بر عهده خواهید داشت.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">مهارت‌های مورد نیاز:</h4>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>حداقل 3 سال تجربه در توسعه قراردادهای هوشمند</li>
                      <li>تسلط بر زبان Solidity و مفاهیم EVM</li>
                      <li>آشنایی با پروتکل‌های DeFi و مکانیزم‌های AMM</li>
                      <li>تجربه در مدیریت تیم فنی و هدایت پروژه‌های نرم‌افزاری</li>
                      <li>آشنایی با فریم‌ورک‌های تست و ابزارهای توسعه بلاکچین</li>
                      <li>دانش کافی در زمینه امنیت قراردادهای هوشمند</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Link href="mailto:dev@zanjir.xyz" target="_blank">
                      <Button className="w-full">
                        ارسال رزومه
                        <ExternalLink className="mr-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

