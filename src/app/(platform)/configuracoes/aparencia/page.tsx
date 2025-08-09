// src/app/(platform)/configuracoes/aparencia/page.tsx
"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Monitor, Sun, Moon, Palette, Smartphone, CheckCircle } from "lucide-react"

const themeOptions = [
  {
    value: "light",
    label: "Claro",
    description: "Aparência clara e limpa, ideal para uso durante o dia",
    icon: Sun,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
  },
  {
    value: "dark", 
    label: "Escuro",
    description: "Aparência escura que reduz o cansaço visual em ambientes com pouca luz",
    icon: Moon,
    color: "text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-900/20"
  },
  {
    value: "system",
    label: "Sistema",
    description: "Sincroniza automaticamente com as preferências do seu dispositivo",
    icon: Monitor,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  }
]

export default function AppearancePage() {
  const { setTheme, theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 animate-pulse">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Aparência</h3>
              <p className="text-muted-foreground">Carregando preferências de tema...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  const activeOption = themeOptions.find(option => option.value === theme)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Personalização da Aparência</h3>
              <p className="text-muted-foreground">
                Escolha como você deseja que a aplicação seja exibida
              </p>
            </div>
          </div>
          {activeOption && (
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
              <activeOption.icon className="h-3 w-3" />
              <span className="text-sm font-medium">{activeOption.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Tema da Interface</h4>
          <p className="text-muted-foreground">
            Selecione o tema que melhor se adequa às suas preferências e ambiente de uso
          </p>
        </div>

        <RadioGroup
          value={theme}
          onValueChange={setTheme}
          className="grid gap-4 md:grid-cols-3"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = theme === option.value
            
            return (
              <Label
                key={option.value}
                className={`
                  relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50
                  ${isSelected 
                    ? 'border-primary bg-accent shadow-md' 
                    : 'border-muted hover:border-muted-foreground/30'
                  }
                `}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                
                {/* Theme Preview */}
                <div className={`
                  mb-4 h-24 w-full rounded-lg border-2 transition-all
                  flex items-center justify-center
                  ${option.value === 'light' ? 'bg-white border-gray-200' : ''}
                  ${option.value === 'dark' ? 'bg-gray-900 border-gray-700' : ''}
                  ${option.value === 'system' ? 'bg-gradient-to-r from-white to-gray-100 border-gray-300' : ''}
                `}>
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-6 w-6 transition-colors ${option.color}`} />
                    {option.value === 'system' && (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </h5>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>

                  {/* System theme indicator */}
                  {option.value === "system" && (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                        {currentTheme === "dark" ? (
                          <>
                            <Moon className="h-3 w-3" />
                            Usando tema escuro
                          </>
                        ) : (
                          <>
                            <Sun className="h-3 w-3" />
                            Usando tema claro
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Sobre os temas
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p>• <strong>Claro:</strong> Melhor para ambientes bem iluminados e uso durante o dia</p>
          <p>• <strong>Escuro:</strong> Reduz o cansaço visual e economiza bateria em telas OLED</p>
          <p>• <strong>Sistema:</strong> Muda automaticamente baseado nas configurações do seu dispositivo</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold mb-4">Ações Rápidas</h4>
        <p className="text-muted-foreground mb-4">
          Alterne rapidamente entre os temas mais utilizados
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            Claro
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="flex items-center gap-2"
          >
            <Moon className="h-4 w-4" />
            Escuro
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("system")}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Sistema
          </Button>
        </div>
      </div>
    </div>
  )
}