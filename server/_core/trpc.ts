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
      const role = ctx.user.role as AppRole;
      if (!roles.includes(role) && role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não possui acesso a esta ação." });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );

export const adminProcedure = roleProcedure("admin");

const UNAUTHED_ERR_MSG = "Você precisa estar autenticado para continuar.";
