/** One customer row in the warehouse customer search (mock data today; the real search returns the same shape). */
export interface CustomerSearchItem {
  name: string;
  code: string;
  id?: string;
  phone: string;
  balance: string;
  status?: string;
}
