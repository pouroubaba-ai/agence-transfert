"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createTransfer } from "@/lib/actions";
import { formatFCFA, groupDigits } from "@/lib/format";
import SearchableSelect from "@/components/searchable-select";

type Option = { id: string; name: string };
type Channel = {
  id: string;
  name: string;
  feeBase: number | null;
  feePerBase: number | null;
  withdrawalFeePercent: number | null;
};

const toNum = (s: string) =>
  parseFloat(s.replace(/\s/g, "").replace(",", ".")) || 0;
const s = (n: number | null | undefined) => (n != null ? String(n) : "");
const digits = (v: string) => v.replace(/[^\d]/g, "");

export default function TransferForm({
  clients,
  channels,
  defaultClientId,
  ussdPrefix,
  ussdPassword,
  ussdSuffix,
}: {
  clients: Option[];
  channels: Channel[];
  defaultClientId: string;
  ussdPrefix: string;
  ussdPassword: string;
  ussdSuffix: string;
}) {
  const first = channels[0];
  const [amount, setAmount] = useState("");
  const [channelId, setChannelId] = useState(first?.id ?? "");
  const currentChannel = channels.find((c) => c.id === channelId);

  const defaultClient = clients.find((c) => c.id === defaultClientId);
  const [clientLabel, setClientLabel] = useState(defaultClient?.name ?? "");
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const isAnonymousName = (n: string) => n.trim().toLowerCase() === "client";
  const [isAnonymous, setIsAnonymous] = useState(
    isAnonymousName(defaultClient?.name ?? "")
  );

  const [feeBase, setFeeBase] = useState(s(first?.feeBase));
  const [feePerBase, setFeePerBase] = useState(s(first?.feePerBase));
  const [manualFee, setManualFee] = useState("");
  const [withdrawalOn, setWithdrawalOn] = useState(false);
  const [initialPayment, setInitialPayment] = useState("");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [pendingUSSD, setPendingUSSD] = useState<string | null>(null);

  // Modale pour nouveau client
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [pendingNewClient, setPendingNewClient] = useState(false);
  // Vrai quand la confirmation du nouveau client doit ensuite lancer l'USSD.
  const [ussdAfterConfirm, setUssdAfterConfirm] = useState(false);

  const [state, formAction, pending] = useActionState(createTransfer, null);
  const result = state as { ok?: boolean; error?: string } | null;

  const defaultName = defaultClient?.name ?? "";

  useEffect(() => {
    if (result?.ok) {
      setAmount("");
      setInitialPayment("");
      setClientLabel(defaultName);
      setSelectedClientId(defaultClientId);
      setIsAnonymous(defaultName.trim().toLowerCase() === "client");
      const ch = channels.find((c) => c.id === channelId);
      setFeeBase(s(ch?.feeBase));
      setFeePerBase(s(ch?.feePerBase));
      setManualFee("");
      setWithdrawalOn(false);
      setBeneficiaryPhone("");
      setShowNewClientModal(false);
      setResetKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result?.ok, defaultName, channels, channelId, defaultClientId]);

  const recapRef = useRef<HTMLDivElement>(null);
  const initialPaymentRef = useRef<HTMLInputElement>(null);
  const [recapVisible, setRecapVisible] = useState(false);

  useEffect(() => {
    const el = recapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setRecapVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Lancer l'USSD après que le reset soit terminé
  useEffect(() => {
    if (!pendingUSSD || !ussdLinkRef.current) return;
    ussdLinkRef.current.href = `tel:${pendingUSSD}`;
    ussdLinkRef.current.click();
    setPendingUSSD(null);
  }, [pendingUSSD]);

  function goToPayment() {
    recapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const input = initialPaymentRef.current;
      if (input && !input.readOnly && !input.disabled) input.focus();
    }, 450);
  }

  function onChannelChange(id: string) {
    setChannelId(id);
    const ch = channels.find((c) => c.id === id);
    setFeeBase(s(ch?.feeBase));
    setFeePerBase(s(ch?.feePerBase));
    setManualFee("");
  }

  const amountNum = toNum(amount);

  const isManualFee = manualFee.trim() !== "";
  const hasFeeRule = feeBase.trim() !== "" && feePerBase.trim() !== "";
  const clientFee = useMemo(() => {
    if (isManualFee) return toNum(manualFee);
    if (hasFeeRule) return (amountNum / toNum(feeBase)) * toNum(feePerBase);
    return 0;
  }, [amountNum, feeBase, feePerBase, manualFee, isManualFee, hasFeeRule]);

  // Frais de retrait : pourcentage du canal, appliqué automatiquement si
  // l'interrupteur est allumé. Jamais commissionnés, ajoutés au montant envoyé.
  const wPercent = currentChannel?.withdrawalFeePercent ?? null;
  const hasWithdrawalRule = wPercent != null && wPercent > 0;
  const withdrawalFee = useMemo(() => {
    if (!withdrawalOn || !hasWithdrawalRule) return 0;
    return (amountNum * (wPercent as number)) / 100;
  }, [withdrawalOn, hasWithdrawalRule, amountNum, wPercent]);

  const sentToBeneficiary = amountNum + withdrawalFee;
  const total = amountNum + clientFee + withdrawalFee;

  // Vérifie si le client est nouveau
  const isNewClient = clientLabel.trim() !== "" && !clients.some((c) => c.name.toLowerCase() === clientLabel.toLowerCase());

  const inputCls =
    "w-full rounded-lg border border-border px-3 py-2 text-sm bg-white";
  const smallInput =
    "w-full rounded-lg border border-border px-2.5 py-1.5 text-sm bg-white";

  const formRef = useRef<HTMLFormElement>(null);
  const ussdLinkRef = useRef<HTMLAnchorElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const textIsNewClient = clientLabel.trim() !== "" && !clients.some((c) => c.name.toLowerCase() === clientLabel.toLowerCase());

    if (textIsNewClient) {
      e.preventDefault();
      setShowNewClientModal(true);
      return;
    }

    // Laisser la soumission normale se faire pour les clients existants
  };

  const confirmNewClient = async () => {
    setPendingNewClient(true);
    const form = formRef.current;
    if (!form) return;

    // Capturer les infos USSD avant toute réinitialisation.
    const wasUSSD = ussdAfterConfirm;
    const phoneForUSSD = beneficiaryPhone.replace(/^\+/, "").replace(/\s/g, "");
    const amountSent = String(Math.round(sentToBeneficiary));

    const formData = new FormData(form);
    formData.set("createNewClient", "true");
    formData.set("newClientName", clientLabel);

    setShowNewClientModal(false);

    // Appeler directement la server action
    const result = await createTransfer(null, formData);

    if (result?.ok) {
      if (wasUSSD) {
        await finishUSSD(phoneForUSSD, amountSent);
      } else {
        setAmount("");
        setInitialPayment("");
        setClientLabel(defaultName);
        setSelectedClientId(defaultClientId);
        setIsAnonymous(defaultName.trim().toLowerCase() === "client");
        const ch = channels.find((c) => c.id === channelId);
        setFeeBase(s(ch?.feeBase));
        setFeePerBase(s(ch?.feePerBase));
        setManualFee("");
        setWithdrawalOn(false);
        setBeneficiaryPhone("");
        setResetKey((k) => k + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    setUssdAfterConfirm(false);
    setPendingNewClient(false);
  };

  // Post-traitement commun après création réussie d'un transfert par USSD :
  // copie du numéro, réinitialisation, puis lancement de l'USSD.
  const finishUSSD = async (phoneForUSSD: string, amountSent: string) => {
    try {
      await navigator.clipboard.writeText(phoneForUSSD);
    } catch {
      console.log("Copie du numéro échouée");
    }
    setAmount("");
    setInitialPayment("");
    setClientLabel(defaultName);
    setSelectedClientId(defaultClientId);
    setIsAnonymous(defaultName.trim().toLowerCase() === "client");
    const ch = channels.find((c) => c.id === channelId);
    setFeeBase(s(ch?.feeBase));
    setFeePerBase(s(ch?.feePerBase));
    setManualFee("");
    setWithdrawalOn(false);
    setBeneficiaryPhone("");
    setResetKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const ussdCode = `${ussdPrefix}*${amountSent}*${phoneForUSSD}*${ussdPassword}${ussdSuffix}`;
    setTimeout(() => setPendingUSSD(ussdCode), 800);
  };

  const handleUSSDTransfer = async () => {
    if (!amount.trim() || !clientLabel.trim() || !beneficiaryPhone.trim()) return;

    const form = formRef.current;
    if (!form) return;

    // Nouveau client → passer par la modale de confirmation, qui lancera l'USSD.
    const textIsNewClient =
      clientLabel.trim() !== "" &&
      !clients.some((c) => c.name.toLowerCase() === clientLabel.toLowerCase());
    if (textIsNewClient) {
      setUssdAfterConfirm(true);
      setShowNewClientModal(true);
      return;
    }

    const formData = new FormData(form);
    const beneficiaryPhoneCopy = beneficiaryPhone;
    // Le bénéficiaire reçoit le montant + les frais de retrait éventuels
    const amountCopy = String(Math.round(sentToBeneficiary));

    // Enlever le '+' et les espaces du numéro pour l'USSD
    const phoneForUSSD = beneficiaryPhoneCopy.replace(/^\+/, "").replace(/\s/g, "");

    // Créer le transfert d'abord
    const result = await createTransfer(null, formData);

    if (result?.ok) {
      await finishUSSD(phoneForUSSD, amountCopy);
    }
  };

  return (
    <>
      {/* Lien invisible pour lancer l'USSD */}
      <a ref={ussdLinkRef} href="#" style={{ display: "none" }} />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 pb-24 lg:grid-cols-3 lg:pb-0"
        action={formAction}
      >
        {amountNum > 0 && !recapVisible && (
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
            <div className="min-w-0">
              <p className="text-[11px] text-muted">Le client te doit</p>
              <p className="truncate font-bold text-primary">{formatFCFA(total)}</p>
            </div>
            <button
              type="button"
              onClick={goToPayment}
              className="btn-primary shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              Paiement ↓
            </button>
          </div>
        )}

        <input type="hidden" name="feeBase" value={isManualFee ? "" : feeBase} />
        <input type="hidden" name="feePerBase" value={isManualFee ? "" : feePerBase} />
        <input type="hidden" name="createNewClient" value="false" />

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold">Détails du transfert</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client *</label>
                <SearchableSelect
                  key={resetKey}
                  name="party"
                  options={clients}
                  defaultId={defaultClientId}
                  placeholder="Rechercher un client…"
                  onChange={(o) => {
                    setClientLabel(o?.name ?? "");
                    setSelectedClientId(o?.id ?? "");
                    setIsAnonymous(o ? isAnonymousName(o.name) : false);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Canal *</label>
                <select
                  name="channelId"
                  required
                  value={channelId}
                  onChange={(e) => onChannelChange(e.target.value)}
                  className={inputCls}
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Montant à transférer *
              </label>
              <input
                name="amount"
                inputMode="numeric"
                required
                value={groupDigits(amount)}
                onChange={(e) => setAmount(digits(e.target.value))}
                placeholder="Ex. 200 000"
                className={inputCls}
              />

              {/* Frais de retrait : interrupteur + aperçu automatique */}
              {hasWithdrawalRule && (
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={withdrawalOn}
                      onChange={(e) => setWithdrawalOn(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">Ajouter les frais de retrait ({wPercent}%)</span>
                  </label>
                  {withdrawalOn && amountNum > 0 && (
                    <p className="mt-1 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                      Frais de retrait : <b>{formatFCFA(withdrawalFee)}</b> · Envoyé au bénéficiaire : <b>{formatFCFA(sentToBeneficiary)}</b>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Montant réellement envoyé au bénéficiaire (base + frais de retrait) */}
            <input type="hidden" name="withdrawalFee" value={String(Math.round(withdrawalFee))} />

            <div className="rounded-xl border border-border p-4 bg-background/40">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Frais client</p>
                {isManualFee ? (
                  <span className="text-xs rounded-full bg-warning/10 text-warning px-2 py-0.5">
                    Manuel
                  </span>
                ) : hasFeeRule ? (
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">
                    Règle du canal
                  </span>
                ) : (
                  <span className="text-xs rounded-full bg-background px-2 py-0.5 text-muted">
                    Aucune règle
                  </span>
                )}
              </div>
              <div className={`grid grid-cols-2 gap-3 mb-3 ${isManualFee ? "opacity-40" : ""}`}>
                <div>
                  <label className="block text-xs text-muted mb-1">Pour chaque</label>
                  <input inputMode="numeric" disabled={isManualFee} value={feeBase}
                    onChange={(e) => setFeeBase(digits(e.target.value))} placeholder="100" className={smallInput} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Frais prélevés</label>
                  <input inputMode="numeric" disabled={isManualFee} value={feePerBase}
                    onChange={(e) => setFeePerBase(digits(e.target.value))} placeholder="20" className={smallInput} />
                </div>
              </div>
              <label className="block text-xs text-muted mb-1">…ou frais manuel (désactive la règle)</label>
              <input name="fee" inputMode="numeric" value={groupDigits(manualFee)}
                onChange={(e) => setManualFee(digits(e.target.value))} placeholder="Montant fixe des frais" className={smallInput} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select name="status" defaultValue="EXECUTE" className={inputCls}>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EXECUTE">Exécuté</option>
              </select>
            </div>
          </div>

          <div key={resetKey} className="card p-5 space-y-4">
            <h2 className="font-semibold">Bénéficiaire</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                Numéro du bénéficiaire {ussdPassword && "*"}
              </label>
              <input
                name="beneficiaryPhone"
                inputMode="numeric"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(digits(e.target.value))}
                placeholder="Numéro de téléphone"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <div ref={recapRef} className="card p-5 sticky top-8 space-y-4">
            <h2 className="font-semibold">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Montant</span>
                <span className="font-medium">{formatFCFA(amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Frais client</span>
                <span className="font-medium">{formatFCFA(clientFee)}</span>
              </div>
              {withdrawalFee > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Frais de retrait</span>
                    <span className="font-medium">{formatFCFA(withdrawalFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Envoyé au bénéficiaire</span>
                    <span className="font-medium">{formatFCFA(sentToBeneficiary)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold">Le client te doit</span>
                <span className="font-bold text-primary">{formatFCFA(total)}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium mb-1">
                Versement initial du client (option)
              </label>
              <input
                ref={initialPaymentRef}
                name="initialPayment"
                inputMode="numeric"
                value={groupDigits(
                  isAnonymous
                    ? total > 0
                      ? String(Math.round(total))
                      : ""
                    : initialPayment
                )}
                readOnly={isAnonymous}
                disabled={amountNum <= 0}
                onChange={(e) => {
                  const dv = digits(e.target.value);
                  setInitialPayment(
                    total > 0 && toNum(dv) > total ? String(Math.round(total)) : dv
                  );
                }}
                placeholder={
                  amountNum <= 0 ? "Saisir d'abord le montant" : "1ère tranche payée"
                }
                className={`${inputCls}${amountNum <= 0 || isAnonymous ? " opacity-60" : ""}`}
              />
              {isAnonymous && (
                <p className="text-[11px] text-muted mt-1">
                  Client anonyme = paiement comptant. Pour un crédit, nomme le client.
                </p>
              )}
              <select name="initialMethod" disabled={amountNum <= 0} className={`${inputCls} mt-2`}>
                <option value="espèces">Espèces</option>
                <option value="mobile money">Mobile money</option>
                <option value="virement">Virement</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                disabled={pending || pendingNewClient || !clientLabel.trim()}
                className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {pending || pendingNewClient ? "..." : "Créer le transfert"}
              </button>
              {ussdPassword ? (
                <button
                  type="button"
                  onClick={handleUSSDTransfer}
                  disabled={pending || pendingNewClient || !amount.trim() || !clientLabel.trim() || !beneficiaryPhone.trim()}
                  className="w-full rounded-lg border border-primary bg-primary/10 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/20 disabled:opacity-60"
                >
                  {pending ? "..." : "Envoyer via USSD"}
                </button>
              ) : (
                <a
                  href="/parametres"
                  className="w-full rounded-lg border border-warning bg-warning/10 text-warning px-4 py-2.5 text-sm font-semibold hover:bg-warning/20 block text-center"
                >
                  📋 Configurer USSD d'abord
                </a>
              )}
            </div>
            {!clientLabel.trim() && (
              <p className="rounded-lg bg-danger/10 text-danger px-3 py-2 text-sm">
                Choisis un client avant de continuer.
              </p>
            )}
            {ussdPassword && !beneficiaryPhone.trim() && (
              <p className="rounded-lg bg-warning/10 text-warning px-3 py-2 text-sm">
                Le numéro du bénéficiaire est requis pour USSD.
              </p>
            )}

            {result?.error && (
              <p className="rounded-lg bg-danger/10 text-danger px-3 py-2 text-sm">
                {result.error}
              </p>
            )}
            {result?.ok && (
              <p className="rounded-lg bg-primary/10 text-primary px-3 py-2 text-sm font-medium">
                ✓ Transfert enregistré
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Modale nouveau client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 space-y-4">
            <h2 className="font-semibold text-lg">Nouveau client</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted">Nom du client :</p>
              <p className="font-medium">{clientLabel}</p>
            </div>
            <p className="text-sm text-muted">
              Ce client n'existe pas encore. Un compte va être créé automatiquement.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowNewClientModal(false);
                  setUssdAfterConfirm(false);
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-background"
              >
                Annuler
              </button>
              <button
                onClick={confirmNewClient}
                disabled={pendingNewClient}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {pendingNewClient ? "..." : "Créer et enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
