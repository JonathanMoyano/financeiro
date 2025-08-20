"use client";

import { useState, useEffect, useRef, useTransition } from "react"; // Importa useTransition
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Mail,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { updateProfile, updatePassword } from "@/app/actions/profile";
import { toast } from "sonner";

function SubmitButton({
  children,
  variant = "default",
  className = "",
  pending = false,
}: {
  children: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  pending?: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      className={`w-full sm:w-auto ${className}`}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function ProfileSection({
  profileState,
  profileFormAction,
  email,
  initialFullName,
  isPending,
}: {
  profileState: any;
  profileFormAction: any;
  email: string;
  initialFullName: string;
  isPending: boolean;
}) {
  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Informações do Perfil</h3>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e dados da conta
          </p>
        </div>
      </div>

      <form action={profileFormAction} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted pr-16"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                Verificado
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              O e-mail não pode ser alterado após a criação da conta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome Completo
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={initialFullName}
              placeholder="Digite seu nome completo"
              className="focus:border-primary focus:ring-primary"
            />
            {profileState?.errors?.fullName && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {profileState.errors.fullName[0]}
              </p>
            )}
          </div>
        </div>

        {profileState?.message && (
          <div
            className={`p-4 rounded-lg border flex items-center gap-2 transition-all ${
              profileState.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {profileState.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{profileState.message}</span>
          </div>
        )}

        <div className="flex justify-end">
          <SubmitButton
            className="bg-primary hover:bg-primary/90"
            pending={isPending}
          >
            Salvar Alterações
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function PasswordSection({
  passwordState,
  passwordFormAction,
  passwordFormRef,
  isPending,
}: {
  passwordState: any;
  passwordFormAction: any;
  passwordFormRef: React.RefObject<HTMLFormElement>;
  isPending: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-blue-500";
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
          <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Segurança da Conta</h3>
          <p className="text-muted-foreground">
            Altere sua senha para manter sua conta segura
          </p>
        </div>
      </div>

      <form
        ref={passwordFormRef}
        action={passwordFormAction}
        className="space-y-6"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua nova senha"
                className="pr-10"
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </span>
              </Button>
            </div>

            {currentPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {passwordState?.errors?.password && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {passwordState.errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                </span>
              </Button>
            </div>

            {passwordState?.errors?.confirmPassword && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {passwordState.errors.confirmPassword[0]}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Dicas para uma senha segura:
            </h4>
          </div>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-6">
            <li className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentPassword.length >= 8 ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              Use pelo menos 8 caracteres
            </li>
            <li className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  /[A-Z]/.test(currentPassword) && /[a-z]/.test(currentPassword)
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
              Inclua letras maiúsculas e minúsculas
            </li>
            <li className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  /\d/.test(currentPassword) &&
                  /[^a-zA-Z\d]/.test(currentPassword)
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
              Adicione números e símbolos especiais
            </li>
          </ul>
        </div>

        {passwordState?.message && (
          <div
            className={`p-4 rounded-lg border flex items-center gap-2 transition-all ${
              passwordState.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {passwordState.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{passwordState.message}</span>
          </div>
        )}

        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirmar alteração de senha
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza de que deseja alterar sua senha? Esta ação irá
                  desconectar você de todos os dispositivos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (passwordFormRef.current) {
                      const formData = new FormData(passwordFormRef.current);
                      const submitEvent = new Event("submit", {
                        bubbles: true,
                        cancelable: true,
                      });
                      passwordFormRef.current.dispatchEvent(submitEvent);
                    }
                  }}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Alterar Senha
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const passwordFormRef = useRef<HTMLFormElement>(null);

  // CORREÇÃO: Usando useActionState em vez de useFormState
  const [profileState, profileFormAction, profileIsPending] = useActionState(
    updateProfile,
    {
      message: "",
      errors: {},
      success: false,
    }
  );

  const [passwordState, passwordFormAction, passwordIsPending] = useActionState(
    updatePassword,
    {
      message: "",
      errors: {},
      success: false,
    }
  );

  useEffect(() => {
    const getUserAndProfile = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            throw profileError;
          }
          if (profile) {
            setInitialFullName(profile.full_name || "");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        toast.error("Não foi possível carregar os dados do seu perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    getUserAndProfile();
  }, [supabase]);

  useEffect(() => {
    if (!profileState?.message) return;
    if (profileState.success) {
      toast.success(profileState.message);
    } else {
      toast.error(profileState.message);
    }
  }, [profileState]);

  useEffect(() => {
    if (!passwordState?.message) return;
    if (passwordState.success) {
      toast.success(passwordState.message);
      passwordFormRef.current?.reset();
    } else {
      toast.error(passwordState.message);
    }
  }, [passwordState]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Carregando informações do perfil...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ProfileSection
        profileState={profileState}
        profileFormAction={profileFormAction}
        email={email}
        initialFullName={initialFullName}
        isPending={profileIsPending}
      />
      <div className="border-t border-border" />
      <PasswordSection
        passwordState={passwordState}
        passwordFormAction={passwordFormAction}
        passwordFormRef={passwordFormRef}
        isPending={passwordIsPending}
      />
    </div>
  );
}
