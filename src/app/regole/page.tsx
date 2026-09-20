import { Panel } from "@/components/ui/Panel";

const SPECIALI = [
  { icon: "🔄", nome: "Scambio", desc: "Scegli un avversario: le vostre mani si scambiano una carta a testa, presa a caso." },
  { icon: "🎲", nome: "Caos", desc: "Si attiva un effetto casuale sul tavolo: può capitare di tutto, in senso buono o cattivo." },
  { icon: "➡️", nome: "Passa", desc: "Scegli una carta dalla tua mano e passala al giocatore successivo." },
  { icon: "🃏", nome: "Jolly", desc: "Scegli il colore che sarà attivo da questo momento in poi." },
  { icon: "💥", nome: "Tavolino", desc: "Tutti i giocatori passano una carta a caso al giocatore successivo, in contemporanea." },
  { icon: "🛡️", nome: "Blocco", desc: "Ti protegge dal prossimo effetto Scambio, Passa o Caos diretto contro di te." }
];

export default function RegolePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl font-bold text-brand-yellow">Come si gioca</h1>
      <p className="mt-3 text-slate-300">
        aTavolino si gioca con un mazzo di carte colorate, numeriche e speciali. Ogni giocatore inizia con 7 carte:
        vince chi per primo resta senza carte in mano.
      </p>

      <Panel className="mt-8">
        <h2 className="font-display text-xl font-semibold text-brand-yellow">Il turno</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-200">
          <li>Al tuo turno devi giocare una carta valida oppure, se non puoi, pescare una carta.</li>
          <li>Una carta numerica è valida se ha lo stesso colore o lo stesso valore della carta in cima al tavolo.</li>
          <li>Le carte speciali colorate sono valide se il colore o il tipo corrisponde alla carta in cima al tavolo.</li>
          <li>Jolly e Caos si possono giocare in qualsiasi momento del tuo turno.</li>
          <li>Dopo aver pescato, il turno passa automaticamente al giocatore successivo.</li>
        </ul>
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-display text-xl font-semibold text-brand-yellow">Carte speciali</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SPECIALI.map((s) => (
            <div key={s.nome} className="flex gap-3 rounded-xl bg-white/5 p-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-semibold">{s.nome}</p>
                <p className="text-sm text-slate-300">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-display text-xl font-semibold text-brand-yellow">Fine partita</h2>
        <p className="mt-3 text-slate-200">
          Il primo giocatore che resta senza carte vince la partita. Gli altri vengono classificati in base al
          numero di carte rimaste in mano: meno carte hai, migliore sarà il tuo piazzamento.
        </p>
      </Panel>
    </div>
  );
}
