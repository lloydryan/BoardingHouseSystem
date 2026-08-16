import { ArrowLeft, FileBarChart, Home, Layers, Pencil, Plus, X } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArchitecturalBuildingView } from "../../components/building/ArchitecturalBuildingView";
import { BuildingLegend } from "../../components/building/BuildingLegend";
import { BuildingTemplateSelector } from "../../components/building/BuildingTemplateSelector";
import { BuildingFloor, BuildingUnit } from "../../components/building/types";
import { StatusBadge } from "../../components/ui";
import { api, apiPatch, apiPost, money } from "../../lib/api";

type BuildingData = {
  property: any;
  floors: BuildingFloor[];
};

export function PropertyBuildingPage() {
  const { propertyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<BuildingData>();
  const [selectedUnit, setSelectedUnit] = useState<BuildingUnit | null>(null);
  const [buildingTemplate, setBuildingTemplate] = useState("modern-apartment");
  const [dialog, setDialog] = useState<"floor" | "unit" | "report" | "edit" | null>(null);
  const selectedFloorId = searchParams.get("floor");

  useEffect(() => {
    api<BuildingData>(`/api/properties/${propertyId}/building`).then((next) => {
      setData(next);
      setBuildingTemplate(next.property.buildingViewTemplate ?? "modern-apartment");
      if (!selectedFloorId && next.floors.length) {
        setSearchParams({ floor: next.floors[0].id }, { replace: true });
      }
    });
  }, [propertyId]);

  const selectedFloor = useMemo(
    () => data?.floors.find((floor) => floor.id === selectedFloorId) ?? data?.floors[0],
    [data, selectedFloorId]
  );

  function selectFloor(floorId: string) {
    setSearchParams({ floor: floorId });
    setSelectedUnit(null);
  }

  function reload(nextFloorId?: string) {
    api<BuildingData>(`/api/properties/${propertyId}/building`).then((next) => {
      setData(next);
      if (nextFloorId) setSearchParams({ floor: nextFloorId });
    });
  }

  if (!data) {
    return (
      <section className="building-page">
        <div className="building-loader" />
      </section>
    );
  }

  return (
    <section className="building-page architectural-page">
      <header className="building-page-header">
        <div>
          <span>{data.property.code} / {data.property.address}</span>
          <h2>{data.property.name}</h2>
        </div>
        <div className="building-actions">
          <Link to="/landlord/properties"><ArrowLeft size={16} /> Properties</Link>
          <button onClick={() => setDialog("floor")}><Layers size={16} /> Add Floor</button>
          <button className="primary-btn" onClick={() => setDialog("unit")}><Plus size={16} /> Add Unit</button>
          <button onClick={() => setDialog("edit")}><Pencil size={16} /> Edit Property</button>
          <button onClick={() => navigate("/landlord/reports")}><FileBarChart size={16} /> View Report</button>
        </div>
      </header>

      <main className="architectural-workspace">
        <section className="building-elevation-panel full-building-panel">
          <ArchitecturalBuildingView
            property={data.property}
            floors={data.floors}
            selectedFloorId={selectedFloor?.id}
            selectedUnitId={selectedUnit?.id}
            onFloorSelect={selectFloor}
            onUnitSelect={setSelectedUnit}
            buildingTemplate={buildingTemplate}
          />
          <footer className="building-only-footer">
            <BuildingLegend />
            <BuildingTemplateSelector value={buildingTemplate} onChange={setBuildingTemplate} />
          </footer>
        </section>
      </main>

      {selectedUnit ? (
        <UnitActionPopup
          unit={selectedUnit}
          propertyId={data.property.id}
          floorId={selectedUnit.floorId}
          onClose={() => setSelectedUnit(null)}
          onOpen={() => navigate(`/landlord/properties/${data.property.id}/floors/${selectedUnit.floorId}/units/${selectedUnit.id}`)}
        />
      ) : null}

      {dialog === "floor" ? (
        <AddFloorDialog propertyId={data.property.id} onClose={() => setDialog(null)} onCreated={(floorId) => { setDialog(null); reload(floorId); }} />
      ) : null}
      {dialog === "unit" ? (
        <AddUnitDialog floors={data.floors} selectedFloor={selectedFloor} onClose={() => setDialog(null)} onCreated={(floorId) => { setDialog(null); reload(floorId); }} />
      ) : null}
      {dialog === "edit" ? (
        <EditPropertyDialog property={data.property} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); reload(); }} />
      ) : null}
    </section>
  );
}

function UnitActionPopup({ unit, propertyId, floorId, onClose, onOpen }: { unit: BuildingUnit; propertyId: string; floorId: string; onClose: () => void; onOpen: () => void }) {
  return (
    <Dialog title={`Unit ${unit.unitNumber}`} onClose={onClose}>
      <div className="unit-popup-body">
        <StatusBadge value={unit.status} />
        <p>{unit.primaryTenant || "This unit is currently vacant."}</p>
        <div className="popup-facts">
          <span>Rent <strong>{money(unit.monthlyRent)}</strong></span>
          <span>Occupancy <strong>{unit.occupancy}/{unit.maximumOccupants}</strong></span>
          <span>Bill <strong>{unit.billingStatus}</strong></span>
          <span>Balance <strong>{money(unit.outstandingBalance)}</strong></span>
          <span>Electricity <strong>{unit.electricityStatus}</strong></span>
          <span>Water <strong>{unit.waterStatus}</strong></span>
        </div>
        <Link className="primary-btn" to={`/landlord/properties/${propertyId}/floors/${floorId}/units/${unit.id}`} onClick={(event) => { event.preventDefault(); onOpen(); }}>
          <Home size={16} /> Open Full Unit
        </Link>
      </div>
    </Dialog>
  );
}

function AddFloorDialog({ propertyId, onClose, onCreated }: { propertyId: string; onClose: () => void; onCreated: (floorId: string) => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apiPost<any>(`/api/properties/${propertyId}/floors`, Object.fromEntries(form))
      .then((floor) => onCreated(floor.id))
      .catch((reason) => setError(reason.message ?? "Unable to add floor."));
  }
  return (
    <Dialog title="Add Floor" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>Floor name<input name="name" required placeholder="Floor 4" /></label>
        <label>Floor number<input name="floorNumber" type="number" min="0" required /></label>
        <label>Display order<input name="displayOrder" type="number" /></label>
        <label>Status<select name="status"><option>Active</option><option>Inactive</option></select></label>
        <label className="wide">Description<input name="description" /></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-btn">Add Floor</button>
      </form>
    </Dialog>
  );
}

function AddUnitDialog({ floors, selectedFloor, onClose, onCreated }: { floors: BuildingFloor[]; selectedFloor?: BuildingFloor; onClose: () => void; onCreated: (floorId: string) => void }) {
  const [floorId, setFloorId] = useState(selectedFloor?.id ?? floors[0]?.id ?? "");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apiPost<any>(`/api/floors/${floorId}/units`, Object.fromEntries(form))
      .then(() => onCreated(floorId))
      .catch((reason) => setError(reason.message ?? "Unable to add unit."));
  }
  return (
    <Dialog title="Add Unit" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>Floor<select value={floorId} onChange={(event) => setFloorId(event.target.value)}>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</select></label>
        <label>Unit number<input name="unitNumber" required /></label>
        <label>Unit name<input name="unitName" /></label>
        <label>Unit type<input name="unitType" defaultValue="Studio" /></label>
        <label>Monthly rent<input name="monthlyRent" type="number" min="0" required /></label>
        <label>Security deposit<input name="securityDeposit" type="number" min="0" defaultValue="0" /></label>
        <label>Maximum occupants<input name="maxOccupants" type="number" min="1" defaultValue="1" /></label>
        <label>Initial status<select name="status"><option>Vacant</option><option>Reserved</option><option>Under Maintenance</option><option>Inactive</option></select></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-btn">Add Unit</button>
      </form>
    </Dialog>
  );
}

function EditPropertyDialog({ property, onClose, onSaved }: { property: any; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPatch(`/api/properties/${property.id}`, Object.fromEntries(new FormData(event.currentTarget)))
      .then(onSaved)
      .catch((reason) => setError(reason.message ?? "Unable to save property."));
  }
  return (
    <Dialog title="Edit Property" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>Name<input name="name" defaultValue={property.name} required /></label>
        <label>Code<input name="code" defaultValue={property.code} required /></label>
        <label className="wide">Address<input name="address" defaultValue={property.address} /></label>
        <label>Contact number<input name="contactNumber" defaultValue={property.contactNumber} /></label>
        <label>Manager<input name="manager" defaultValue={property.manager} /></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-btn">Save Property</button>
      </form>
    </Dialog>
  );
}

function InfoDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{children}</p>
    </Dialog>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <section className="dialog compact-dialog">
        <header><h3>{title}</h3><button onClick={onClose} title="Close"><X size={18} /></button></header>
        {children}
      </section>
    </div>
  );
}
