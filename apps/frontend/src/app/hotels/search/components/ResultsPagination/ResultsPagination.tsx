import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import { styles } from "./ResultsPagination.styles";

interface ResultsPaginationProps {
  page: number;
  pageSize: number;
  // Hotels matching so far, and whether more may still be priced.
  total: number;
  complete: boolean;
  shown: number;
  disabled: boolean;
  onChange: (page: number) => void;
}

// "Showing 21–40" and page numbers. While the supplier has more hotels and
// this page is full, one extra page is offered; opening it prices the next
// batch. (A short page means the backend already looked further and found
// no more matches.)
export default function ResultsPagination({ page, pageSize, total, complete, shown, disabled, onChange }: ResultsPaginationProps) {
  const known = Math.ceil(total / pageSize);
  const more = !complete && shown === pageSize;
  const count = Math.max(page, more ? known + 1 : known);
  if (count <= 1 || !shown) return null;
  const first = (page - 1) * pageSize + 1;
  return (
    <Box component="nav" aria-label="Result pages" sx={styles.root}>
      <Typography sx={styles.summary}>
        Showing {first}–{first + shown - 1}
      </Typography>
      <Pagination
        page={page}
        count={count}
        color="primary"
        shape="rounded"
        siblingCount={1}
        disabled={disabled}
        onChange={(_, value) => onChange(value)}
      />
    </Box>
  );
}
