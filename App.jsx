import { useState, useEffect } from "react";

const SUPABASE_URL = "https://uoaacuxktqotjhukxdvu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYWFjdXhrdHFvdGpodWt4ZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTYwMDcsImV4cCI6MjA5NzczMjAwN30.ZmAHM--oBVa3pQC3mfIjStjzxwJWCRx19LdZx6RZFTw";

const api = async (method, path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};

const dbToLocal = (r) => ({ id: r.id, patientNom: r.patient_nom, patientTel: r.patient_tel, date: r.date, heure: r.heure, medecin: r.medecin, tarif: r.tarif, notes: r.notes || "" });
const localToDb = (f) => ({ patient_nom: f.patientNom, patient_tel: f.patientTel, date: f.date, heure: f.heure, medecin: f.medecin, tarif: f.tarif, notes: f.notes });

const C = {
  bg: "#0D1F1A", surface: "#122319", card: "#172B20", border: "#2A4035",
  accent: "#C9A84C", accentLight: "#E8C97A", text: "#F0EDE4",
  textMuted: "#8A9E93", danger: "#C0392B", whatsapp: "#25D366",
  karima: "#E91E8C", karimaBg: "#E91E8C18", karimaBorder: "#E91E8C44",
  youssef: "#2196F3", youssefBg: "#2196F318", youssefBorder: "#2196F344",
};

const TARIFS = [
  { id: "bilan_adulte", label: "Consultation Bilan / Séance adulte", prix: 500 },
  { id: "suivi_adulte", label: "Consultation Suivi adulte", prix: 400 },
  { id: "bilan_enfant", label: "Consultation Bilan / Séance enfant", prix: 300 },
  { id: "suivi_enfant", label: "Consultation Suivi enfant", prix: 200 },
  { id: "douleur", label: "Consultation Douleur", prix: 400 },
  { id: "addictologie", label: "Consultation Addictologie", prix: 600 },
];

const CHARGES = [
  { label: "Téléphone", montant: 200 },
  { label: "Gasoil", montant: 600 },
  { label: "Eau / Électricité", montant: 300 },
  { label: "CNSS", montant: 600 },
];
const TOTAL_CHARGES = CHARGES.reduce((s, c) => s + c.montant, 0);

const MEDECINS = [
  { id: "karima", nom: "Dr. Karima", couleur: C.karima, bg: C.karimaBg, border: C.karimaBorder },
  { id: "youssef", nom: "Dr. Youssef", couleur: C.youssef, bg: C.youssefBg, border: C.youssefBorder },
];

const getMedecin = (id) => MEDECINS.find(m => m.id === id) || MEDECINS[0];
const getTarif = (id) => TARIFS.find(t => t.id === id) || TARIFS[0];
const today = () => new Date().toISOString().split("T")[0];
const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
const formatMoney = (n) => `${n.toLocaleString("fr-MA")} Dh`;
const getWeekRange = () => {
  const now = new Date(); const day = now.getDay() || 7;
  const monday = new Date(now); monday.setDate(now.getDate() - day + 1);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
};
const getMonthRange = () => {
  const now = new Date();
  return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0] };
};

// ── UI primitives ──
const Btn = ({ children, onClick, variant = "primary", small, disabled, style: ext }) => {
  const s = {
    primary: { background: C.accent, color: "#0D1F1A", border: "none" },
    ghost: { background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` },
    danger: { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}44` },
    whatsapp: { background: C.whatsapp + "22", color: C.whatsapp, border: `1px solid ${C.whatsapp}44` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...s[variant], borderRadius: 8, padding: small ? "5px 12px" : "8px 18px", fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, fontFamily: "inherit", transition: "opacity .15s", ...ext }}>{children}</button>;
};
const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
    <input {...props} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", ...props.style }} />
  </div>
);
const Sel = ({ label, children, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
    <select {...props} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer", ...props.style }}>{children}</select>
  </div>
);
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Form RDV ──
const FormRdv = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial || { patientNom: "", patientTel: "", date: today(), heure: "09:00", medecin: MEDECINS[0].id, tarif: TARIFS[0].id, notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const med = getMedecin(form.medecin);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Médecin selector visuel */}
      <div>
        <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Médecin</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {MEDECINS.map(m => (
            <button key={m.id} onClick={() => set("medecin", m.id)} style={{
              background: form.medecin === m.id ? m.bg : "transparent",
              border: `2px solid ${form.medecin === m.id ? m.couleur : C.border}`,
              borderRadius: 10, padding: "12px", cursor: "pointer", color: form.medecin === m.id ? m.couleur : C.textMuted,
              fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all .15s"
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.couleur, display: "inline-block", marginRight: 8 }} />
              {m.nom}
            </button>
          ))}
        </div>
      </div>
      <Input label="Nom du patient" value={form.patientNom} onChange={e => set("patientNom", e.target.value)} placeholder="Ex: Fatima Benali" />
      <Input label="Téléphone (WhatsApp)" type="tel" value={form.patientTel} onChange={e => set("patientTel", e.target.value)} placeholder="06XXXXXXXX" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Date" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        <Input label="Heure" type="time" value={form.heure} onChange={e => set("heure", e.target.value)} />
      </div>
      <Sel label="Type de consultation" value={form.tarif} onChange={e => set("tarif", e.target.value)}>
        {TARIFS.map(t => <option key={t.id} value={t.id}>{t.label} — {t.prix} Dh</option>)}
      </Sel>
      <Input label="Notes (optionnel)" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Motif, remarques..." />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
        <Btn variant="ghost" onClick={onCancel}>Annuler</Btn>
        <Btn disabled={loading} style={{ background: med.couleur }} onClick={() => { if (!form.patientNom.trim() || !form.patientTel.trim()) return alert("Nom et téléphone requis"); onSave(form); }}>
          {loading ? "Enregistrement..." : initial ? "Modifier" : "Créer le RDV"}
        </Btn>
      </div>
    </div>
  );
};

// ── WhatsApp ──
const openWhatsapp = (rdv) => {
  const tarif = getTarif(rdv.tarif);
  const med = getMedecin(rdv.medecin);
  const msg = encodeURIComponent(`Bonjour ${rdv.patientNom},\n\nNous vous rappelons votre rendez-vous au Cabinet Sanbao :\n📅 ${formatDate(rdv.date)} à ${rdv.heure}\n👨‍⚕️ ${med.nom}\n💊 ${tarif.label} — ${tarif.prix} Dh\n\nMerci de confirmer votre présence.\n\nCabinet Sanbao — Tanger`);
  window.open(`https://wa.me/212${rdv.patientTel.replace(/^0/, "")}?text=${msg}`, "_blank");
};

// ── Card RDV ──
const CardRdv = ({ rdv, onEdit, onDelete, deleting }) => {
  const tarif = getTarif(rdv.tarif);
  const med = getMedecin(rdv.medecin);
  const isPast = rdv.date < today();
  return (
    <div style={{ background: C.card, border: `1px solid ${med.border}`, borderLeft: `4px solid ${med.couleur}`, borderRadius: 12, padding: "14px 16px", opacity: isPast ? .6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: med.couleur, flexShrink: 0 }} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{rdv.patientNom}</span>
          </div>
          <div style={{ color: C.textMuted, fontSize: 12, paddingLeft: 16 }}>{rdv.patientTel}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: med.couleur, fontSize: 12, fontWeight: 700 }}>{med.nom}</div>
          <div style={{ color: C.accentLight, fontWeight: 800, fontSize: 15 }}>{formatMoney(tarif.prix)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, color: C.textMuted, fontSize: 13, flexWrap: "wrap" }}>
        <span>📅 {formatDate(rdv.date)}</span>
        <span>🕐 {rdv.heure}</span>
        <span style={{ color: C.textMuted, fontSize: 12 }}>{tarif.label}</span>
      </div>
      {rdv.notes && <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>📝 {rdv.notes}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <Btn variant="whatsapp" small onClick={() => openWhatsapp(rdv)}>📲 Rappel WA</Btn>
        <Btn variant="ghost" small onClick={() => onEdit(rdv)}>Modifier</Btn>
        <Btn variant="danger" small disabled={deleting} onClick={() => onDelete(rdv.id)}>Supprimer</Btn>
      </div>
    </div>
  );
};

// ── DASHBOARD ──
const Dashboard = ({ rdvs }) => {
  const t = today(); const { start: ws, end: we } = getWeekRange(); const { start: ms, end: me } = getMonthRange();
  const filter = (s, e) => rdvs.filter(r => r.date >= s && r.date <= e);
  const revenue = (list) => list.reduce((sum, r) => sum + (getTarif(r.tarif)?.prix || 0), 0);
  const todayRdv = filter(t, t), weekRdv = filter(ws, we), monthRdv = filter(ms, me);
  const byMed = (list, id) => list.filter(r => r.medecin === id);
  const upcoming = rdvs.filter(r => r.date >= t).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure)).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Stats globales */}
      <div>
        <h2 style={{ color: C.text, margin: "0 0 14px", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Vue globale</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {[["Aujourd'hui", todayRdv], ["Cette semaine", weekRdv], ["Ce mois", monthRdv], ["Total", rdvs]].map(([label, list]) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
              <div style={{ color: C.accentLight, fontSize: 28, fontWeight: 800 }}>{list.length}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{formatMoney(revenue(list))}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats par médecin côte à côte */}
      <div>
        <h2 style={{ color: C.text, margin: "0 0 14px", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Par médecin</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {MEDECINS.map(m => {
            const mToday = byMed(todayRdv, m.id), mWeek = byMed(weekRdv, m.id), mMonth = byMed(monthRdv, m.id);
            return (
              <div key={m.id} style={{ background: C.card, border: `2px solid ${m.border}`, borderTop: `4px solid ${m.couleur}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ color: m.couleur, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>{m.nom}</div>
                {[["Aujourd'hui", mToday], ["Cette semaine", mWeek], ["Ce mois", mMonth]].map(([lbl, list]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: C.textMuted, fontSize: 13 }}>{lbl}</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{list.length} RDV</span>
                      <span style={{ color: m.couleur, fontWeight: 700, fontSize: 12, marginLeft: 8 }}>{formatMoney(revenue(list))}</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>Total généré</span>
                  <span style={{ color: C.accentLight, fontWeight: 800, fontSize: 16 }}>{formatMoney(revenue(byMed(rdvs, m.id)))}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prochains RDV */}
      <div>
        <h2 style={{ color: C.text, margin: "0 0 14px", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Prochains rendez-vous</h2>
        {upcoming.length === 0
          ? <div style={{ color: C.textMuted, fontSize: 14, padding: "20px 0" }}>Aucun rendez-vous à venir.</div>
          : upcoming.map(rdv => {
            const tarif = getTarif(rdv.tarif); const med = getMedecin(rdv.medecin);
            return (
              <div key={rdv.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ background: med.bg, border: `1px solid ${med.border}`, borderRadius: 10, padding: "8px 12px", textAlign: "center", minWidth: 56 }}>
                  <div style={{ color: med.couleur, fontSize: 15, fontWeight: 800 }}>{rdv.heure}</div>
                  <div style={{ color: C.textMuted, fontSize: 10 }}>{formatDate(rdv.date)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{rdv.patientNom}</div>
                  <div style={{ color: C.textMuted, fontSize: 12 }}>{tarif.label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: med.couleur, fontSize: 11, fontWeight: 700 }}>{med.nom}</div>
                  <div style={{ color: C.accentLight, fontWeight: 800 }}>{formatMoney(tarif.prix)}</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ── AGENDA GRILLE ──
const AgendaGrille = ({ rdvs, onEdit, onDelete, deleting }) => {
  const [semaine, setSemaine] = useState(today());
  const [filtreMed, setFiltreMed] = useState("tous");

  const getMonday = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00"); const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1); return d.toISOString().split("T")[0];
  };
  const monday = getMonday(semaine);
  const jours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday + "T00:00:00"); d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const rdvDuJour = (date) => rdvs
    .filter(r => r.date === date && (filtreMed === "tous" || r.medecin === filtreMed))
    .sort((a, b) => a.heure.localeCompare(b.heure));

  const prevSemaine = () => { const d = new Date(monday + "T00:00:00"); d.setDate(d.getDate() - 7); setSemaine(d.toISOString().split("T")[0]); };
  const nextSemaine = () => { const d = new Date(monday + "T00:00:00"); d.setDate(d.getDate() + 7); setSemaine(d.toISOString().split("T")[0]); };

  const sendRappels = () => {
    const demain = new Date(); demain.setDate(demain.getDate() + 1);
    const d = demain.toISOString().split("T")[0];
    const liste = rdvs.filter(r => r.date === d && (filtreMed === "tous" || r.medecin === filtreMed));
    if (liste.length === 0) return alert("Aucun RDV demain.");
    liste.forEach((rdv, i) => setTimeout(() => openWhatsapp(rdv), i * 800));
  };

  const jourLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div>
      {/* Légende couleurs */}
      <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {MEDECINS.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: m.couleur }} />
            <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>{m.nom}</span>
          </div>
        ))}
      </div>

      {/* Contrôles */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px" }}>
          <button onClick={prevSemaine} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>‹</button>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600, minWidth: 140, textAlign: "center" }}>
            {new Date(monday + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — {new Date(jours[6] + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <button onClick={nextSemaine} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>›</button>
        </div>
        <Sel value={filtreMed} onChange={e => setFiltreMed(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="tous">Tous les médecins</option>
          {MEDECINS.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </Sel>
        <Btn variant="whatsapp" onClick={sendRappels}>📲 Rappels demain</Btn>
        <Btn variant="ghost" onClick={() => setSemaine(today())}>Aujourd'hui</Btn>
      </div>

      {/* Grille */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {jours.map((date, i) => {
          const rdvList = rdvDuJour(date);
          const isToday = date === today();
          return (
            <div key={date} style={{ minHeight: 140 }}>
              {/* Header jour */}
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{jourLabels[i]}</div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isToday ? C.accent : "transparent", color: isToday ? "#0D1F1A" : C.text, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0" }}>
                  {new Date(date + "T00:00:00").getDate()}
                </div>
              </div>
              {/* RDV du jour */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {rdvList.map(rdv => {
                  const med = getMedecin(rdv.medecin);
                  const tarif = getTarif(rdv.tarif);
                  return (
                    <div key={rdv.id} onClick={() => onEdit(rdv)} style={{
                      background: med.bg, border: `1px solid ${med.border}`, borderLeft: `3px solid ${med.couleur}`,
                      borderRadius: 7, padding: "6px 8px", cursor: "pointer", transition: "opacity .15s"
                    }} onMouseEnter={e => e.currentTarget.style.opacity = ".8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      <div style={{ color: med.couleur, fontSize: 11, fontWeight: 800 }}>{rdv.heure}</div>
                      <div style={{ color: C.text, fontSize: 11, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rdv.patientNom}</div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginTop: 1 }}>{formatMoney(tarif.prix)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Liste détaillée du jour sélectionné */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ color: C.text, margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Détail — cliquez un RDV pour modifier</h3>
        {rdvs.filter(r => jours.includes(r.date) && (filtreMed === "tous" || r.medecin === filtreMed)).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure)).map(rdv => (
          <CardRdv key={rdv.id} rdv={rdv} onEdit={onEdit} onDelete={onDelete} deleting={deleting === rdv.id} />
        )).reduce((acc, el, i) => [...acc, <div key={i} style={{ marginBottom: 10 }}>{el}</div>], [])}
      </div>
    </div>
  );
};

// ── PATIENTS ──
const ListePatients = ({ rdvs, onEdit, onDelete, deleting }) => {
  const [search, setSearch] = useState("");
  const [filtreMed, setFiltreMed] = useState("tous");
  const filtered = rdvs.filter(r =>
    (r.patientNom.toLowerCase().includes(search.toLowerCase()) || r.patientTel.includes(search)) &&
    (filtreMed === "tous" || r.medecin === filtreMed)
  ).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou tél..." style={{ minWidth: 200 }} />
        <Sel value={filtreMed} onChange={e => setFiltreMed(e.target.value)} style={{ width: "auto", minWidth: 180 }}>
          <option value="tous">Tous les médecins</option>
          {MEDECINS.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </Sel>
      </div>
      <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 14 }}>{filtered.length} rendez-vous</div>
      {filtered.length === 0 ? <div style={{ color: C.textMuted, textAlign: "center", padding: "30px 0" }}>Aucun résultat.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map(rdv => <CardRdv key={rdv.id} rdv={rdv} onEdit={onEdit} onDelete={onDelete} deleting={deleting === rdv.id} />)}</div>}
    </div>
  );
};

// ── FINANCES ──
const Finances = ({ rdvs }) => {
  const { start: ms, end: me } = getMonthRange();
  const [moisDebut, setMoisDebut] = useState(ms);
  const [moisFin, setMoisFin] = useState(me);

  const filtered = rdvs.filter(r => r.date >= moisDebut && r.date <= moisFin);
  const revenue = (list) => list.reduce((sum, r) => sum + (getTarif(r.tarif)?.prix || 0), 0);
  const totalRevenu = revenue(filtered);
  const beneficeNet = totalRevenu - TOTAL_CHARGES;

  const byTarif = TARIFS.map(t => ({ ...t, count: filtered.filter(r => r.tarif === t.id).length, total: filtered.filter(r => r.tarif === t.id).length * t.prix }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Input label="Du" type="date" value={moisDebut} onChange={e => setMoisDebut(e.target.value)} style={{ width: "auto" }} />
        <Input label="Au" type="date" value={moisFin} onChange={e => setMoisFin(e.target.value)} style={{ width: "auto" }} />
      </div>

      {/* Résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Chiffre d'affaires</div>
          <div style={{ color: C.accentLight, fontSize: 28, fontWeight: 800 }}>{formatMoney(totalRevenu)}</div>
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{filtered.length} consultations</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Charges fixes</div>
          <div style={{ color: C.danger, fontSize: 28, fontWeight: 800 }}>− {formatMoney(TOTAL_CHARGES)}</div>
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>par mois</div>
        </div>
        <div style={{ background: beneficeNet >= 0 ? "#27AE6018" : C.danger + "18", border: `1px solid ${beneficeNet >= 0 ? "#27AE6044" : C.danger + "44"}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Bénéfice net</div>
          <div style={{ color: beneficeNet >= 0 ? "#27AE60" : C.danger, fontSize: 28, fontWeight: 800 }}>{beneficeNet >= 0 ? "+" : ""}{formatMoney(beneficeNet)}</div>
        </div>
      </div>

      {/* Par médecin */}
      <div>
        <h3 style={{ color: C.text, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Par médecin</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {MEDECINS.map(m => {
            const mRdvs = filtered.filter(r => r.medecin === m.id);
            const mRevenu = revenue(mRdvs);
            const mCharges = TOTAL_CHARGES / 2;
            const mNet = mRevenu - mCharges;
            return (
              <div key={m.id} style={{ background: C.card, border: `2px solid ${m.border}`, borderTop: `4px solid ${m.couleur}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ color: m.couleur, fontWeight: 800, fontSize: 15, marginBottom: 14 }}>{m.nom}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Consultations</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{mRdvs.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Revenus</span>
                  <span style={{ color: C.accentLight, fontWeight: 700 }}>{formatMoney(mRevenu)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Charges (50%)</span>
                  <span style={{ color: C.danger, fontWeight: 700 }}>− {formatMoney(mCharges)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 700 }}>Net</span>
                  <span style={{ color: mNet >= 0 ? "#27AE60" : C.danger, fontWeight: 800, fontSize: 16 }}>{mNet >= 0 ? "+" : ""}{formatMoney(mNet)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Détail charges */}
      <div>
        <h3 style={{ color: C.text, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Détail des charges mensuelles</h3>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {CHARGES.map((ch, i) => (
            <div key={ch.label} style={{ display: "flex", justifyContent: "space-between", padding: "13px 20px", borderBottom: i < CHARGES.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ color: C.textMuted, fontSize: 14 }}>{ch.label}</span>
              <span style={{ color: C.danger, fontWeight: 700 }}>− {formatMoney(ch.montant)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", background: C.danger + "11", borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.text, fontWeight: 700 }}>Total charges</span>
            <span style={{ color: C.danger, fontWeight: 800, fontSize: 16 }}>− {formatMoney(TOTAL_CHARGES)}</span>
          </div>
        </div>
      </div>

      {/* Détail par type de consultation */}
      <div>
        <h3 style={{ color: C.text, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Détail par type de consultation</h3>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {byTarif.filter(t => t.count > 0).map((t, i, arr) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>{t.count} × {formatMoney(t.prix)}</div>
              </div>
              <span style={{ color: C.accentLight, fontWeight: 700 }}>{formatMoney(t.total)}</span>
            </div>
          ))}
          {byTarif.every(t => t.count === 0) && <div style={{ color: C.textMuted, textAlign: "center", padding: 24, fontSize: 14 }}>Aucune consultation sur cette période.</div>}
        </div>
      </div>
    </div>
  );
};

// ── APP ──
export default function App() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRdv, setEditRdv] = useState(null);

  useEffect(() => {
    api("GET", "rendez_vous?order=date.asc,heure.asc")
      .then(data => setRdvs(data.map(dbToLocal)))
      .catch(e => setError("Erreur connexion Supabase : " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const addRdv = async (form) => {
    setSaving(true);
    try { const data = await api("POST", "rendez_vous", localToDb(form)); setRdvs(prev => [...prev, dbToLocal(data[0])]); setModalOpen(false); }
    catch (e) { alert("Erreur : " + e.message); }
    setSaving(false);
  };
  const updateRdv = async (form) => {
    setSaving(true);
    try { await api("PATCH", `rendez_vous?id=eq.${editRdv.id}`, localToDb(form)); setRdvs(prev => prev.map(r => r.id === editRdv.id ? { ...form, id: r.id } : r)); setEditRdv(null); }
    catch (e) { alert("Erreur : " + e.message); }
    setSaving(false);
  };
  const deleteRdv = async (id) => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    setDeleting(id);
    try { await api("DELETE", `rendez_vous?id=eq.${id}`); setRdvs(prev => prev.filter(r => r.id !== id)); }
    catch (e) { alert("Erreur : " + e.message); }
    setDeleting(null);
  };

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "agenda", label: "Agenda", icon: "◷" },
    { id: "patients", label: "Patients", icon: "◉" },
    { id: "finances", label: "Finances", icon: "◎" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#0D1F1A" }}>三</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>SANBAO</div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Gestion Cabinet</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {MEDECINS.map(m => <div key={m.id} style={{ width: 10, height: 10, borderRadius: "50%", background: m.couleur }} title={m.nom} />)}
          </div>
          <Btn onClick={() => setModalOpen(true)}>+ Nouveau RDV</Btn>
        </div>
      </div>

      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 2, padding: "0 16px", overflowX: "auto" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ background: "none", border: "none", color: page === n.id ? C.accent : C.textMuted, borderBottom: `2px solid ${page === n.id ? C.accent : "transparent"}`, padding: "12px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        {loading && <div style={{ color: C.textMuted, textAlign: "center", padding: 60, fontSize: 16 }}>Chargement...</div>}
        {error && <div style={{ color: C.danger, textAlign: "center", padding: 40, fontSize: 14 }}>{error}</div>}
        {!loading && !error && (
          <>
            {page === "dashboard" && <Dashboard rdvs={rdvs} />}
            {page === "agenda" && <AgendaGrille rdvs={rdvs} onEdit={setEditRdv} onDelete={deleteRdv} deleting={deleting} />}
            {page === "patients" && <ListePatients rdvs={rdvs} onEdit={setEditRdv} onDelete={deleteRdv} deleting={deleting} />}
            {page === "finances" && <Finances rdvs={rdvs} />}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau rendez-vous">
        <FormRdv onSave={addRdv} onCancel={() => setModalOpen(false)} loading={saving} />
      </Modal>
      <Modal open={!!editRdv} onClose={() => setEditRdv(null)} title="Modifier le rendez-vous">
        {editRdv && <FormRdv initial={editRdv} onSave={updateRdv} onCancel={() => setEditRdv(null)} loading={saving} />}
      </Modal>
    </div>
  );
}
