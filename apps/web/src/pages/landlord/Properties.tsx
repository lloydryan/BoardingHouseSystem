import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { Page, StatusBadge } from "../../components/ui";

export function Properties() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/properties").then(setRows); }, []);
  return (
    <Page title="Properties" eyebrow="Boarding house portfolio" actions={<button className="primary-btn"><Plus size={16} /> Add property</button>}>
      <div className="property-grid">
        {rows.map((item) => (
          <Link className="property-card" key={item.id} to={`/landlord/properties/${item.id}/building`}>
            <div className="property-media">{item.code}</div>
            <h3>{item.name}</h3>
            <p>{item.address}</p>
            <div className="property-stats"><span>{item.occupiedUnits}/{item.totalUnits} occupied</span><StatusBadge value={item.status} /></div>
            <strong>{money(item.monthlyExpectedRent)} expected rent</strong>
          </Link>
        ))}
      </div>
    </Page>
  );
}
