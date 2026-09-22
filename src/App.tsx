import { BrowserRouter, Routes, Route } from "react-router";
import { ConvexAuthProvider, convexClient } from "./lib/convex";
import Landing from "./pages/Landing";
import Workspace from "./pages/Workspace";
import Tender from "./pages/Tender";
import Proof from "./pages/Proof";
import Judges from "./pages/Judges";

export default function App() {
  return (
    <ConvexAuthProvider client={convexClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Workspace />} />
          <Route path="/app/tenders/:id" element={<Tender />} />
          <Route path="/app/tenders/:id/changes" element={<Tender />} />
          <Route path="/app/tenders/:id/evidence" element={<Tender />} />
          <Route path="/app/tenders/:id/inbox" element={<Tender />} />
          <Route path="/app/tenders/:id/submission" element={<Tender />} />
          <Route path="/proof" element={<Proof />} />
          <Route path="/judges" element={<Judges />} />
        </Routes>
      </BrowserRouter>
    </ConvexAuthProvider>
  );
}
