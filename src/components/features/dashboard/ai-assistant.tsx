"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return;
    setIsLoading(true);
    setAnswer("");

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      // Verifica se o pedido foi bem-sucedido
      if (!response.ok) {
        // Tenta obter uma mensagem de erro mais específica da API
        const errorData = await response.text();
        throw new Error(errorData || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer);

    } catch (error: any) {
      console.error("Erro ao contatar a IA:", error);
      setAnswer(`Desculpe, ocorreu um erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          Assistente Financeiro com IA
        </CardTitle>
        <CardDescription>Faça uma pergunta sobre seus gastos e receba uma análise.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Ex: Onde posso economizar mais este mês?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button onClick={handleAsk} disabled={isLoading || !question}>
          {isLoading ? "Analisando..." : "Perguntar à IA"}
        </Button>
        {answer && (
          <div className="p-4 bg-muted rounded-lg border">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
