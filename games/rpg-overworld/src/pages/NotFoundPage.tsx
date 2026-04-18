import { Link } from "react-router-dom";
import { Panel } from "../components/common/Panel";

export const NotFoundPage = () => (
  <Panel eyebrow="Lost" title="That path leads nowhere">
    <p>The road you tried isn't on Hollowmere's map.</p>
    <Link className="primary-button inline-button" to="/">
      Return Home
    </Link>
  </Panel>
);
