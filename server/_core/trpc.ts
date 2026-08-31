import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export type AppRole = "admin" | "gestor" | "comercial" | "producao" | "compras" | "pos_venda";

export const roleProcedure = (...roles: AppRole[]) =>
  t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      const role = ctx.user.role as AppRole | "user";
      // 'admin' e 'user' têm acesso completo (gestor por padrão)
      if (role === "admin" || role === "user" || roles.includes(role as AppRole)) {
        return next({ ctx: { ...ctx, user: ctx.user } });
      }
      throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não possui acesso a esta ação." });
    }),
  );

export const adminProcedure = roleProcedure("admin");

const UNAUTHED_ERR_MSG = "Você precisa estar autenticado para continuar.";
