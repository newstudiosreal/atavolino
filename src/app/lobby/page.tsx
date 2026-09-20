import { Panel } from "@/components/ui/Panel";
import { CreateGameForm } from "@/components/lobby/CreateGameForm";
import { JoinGameForm } from "@/components/lobby/JoinGameForm";

export default function LobbyEntryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-center font-display text-3xl font-bold text-brand-yellow">Crea o unisciti a un tavolo</h1>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-display text-xl font-semibold">Crea partita</h2>
          <CreateGameForm />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-display text-xl font-semibold">Unisciti a una partita</h2>
          <JoinGameForm />
        </Panel>
      </div>
    </div>
  );
}
