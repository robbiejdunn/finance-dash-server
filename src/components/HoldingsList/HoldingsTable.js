import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { useHistory } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { toCurrencyString } from '../../utils';
import AddIcon from '@mui/icons-material/Add';
import CreateHoldingDialog from './CreateHoldingDialog';


function createData(id, name, symbol, units, currentPrice, marketValue) {
    return { id, name, symbol, units, currentPrice, marketValue };
}


function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}


function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}


function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}


const headCells = [
    { id: 'name', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'symbol', numeric: false, disablePadding: false, label: 'Symbol' },
    { id: 'currentPrice', numeric: false, disablePadding: false, label: 'Current Price' },
    { id: 'units', numeric: false, disablePadding: false, label: 'Units' },
    { id: 'marketValue', numeric: false, disablePadding: false, label: 'Market Value'}
];


function EnhancedTableHead(props) {
    const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all holdings' }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                >
                    <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                    >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                            <span className={classes.visuallyHidden}>
                                {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </span>
                        ) : null}
                    </TableSortLabel>
                </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}


EnhancedTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};


const useToolbarStyles = makeStyles((theme) => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    highlight:
        theme.palette.mode === 'light'
        ? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
        : {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.secondary.dark,
        },
    title: {
        flex: '1 1 100%',
    },
}));


const EnhancedTableToolbar = (props) => {
    const classes = useToolbarStyles();
    const { numSelected } = props;

    const handleAddHoldingClick = (event) => {
        console.log("holdingadded")
    }

    return (
        <Toolbar
            className={clsx(classes.root, {
                [classes.highlight]: numSelected > 0,
            })}
        >
        {numSelected > 0 ? (
            <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
            {numSelected} selected
            </Typography>
        ) : (
            <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Holdings
            </Typography>
        )}
        
        {numSelected > 0 && (
            <Tooltip title="Delete">
                <IconButton aria-label="delete" size="large">
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        )}
        <CreateHoldingDialog />
    </Toolbar>
    );
};


EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
    height: 600,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  }
}));


export default function HoldingsTable(props) {
    let history = useHistory();
    const classes = useStyles();
    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('marketValue');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const rows = props.holdings.map(holding => {
        return createData(
            holding['id']['S'],
            holding['name']['S'],
            holding['symbol']['S'],
            holding['units']['N'],
            holding['currentPrice']['N'],
            holding['marketValue']['N'],
        );
    });

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleRowCLick = (event, id) => {
        history.push(`/holdings/${id}`);
    }

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];
        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }
        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const isSelected = (name) => selected.indexOf(name) !== -1;

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    return (
        <div className={classes.root}>
            <Paper className={classes.paper}>
                <EnhancedTableToolbar numSelected={selected.length} />
                <TableContainer>
                    <Table
                        className={classes.table}
                        aria-labelledby="tableTitle"
                        size='medium'
                        aria-label="enhanced table"
                    >
                        <EnhancedTableHead
                            classes={classes}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const isItemSelected = isSelected(row.id);
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    let totalGainClass;
                                    if (row.totalGain < 0) {
                                        totalGainClass = classes.gainLoss
                                    } else {
                                        totalGainClass = classes.gainProfit
                                    }
                                    return (
                                        <TableRow
                                            hover
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.id}
                                            selected={isItemSelected}
                                            onDoubleClick={(event) => handleRowCLick(event, row.id)}
                                            sx={{cursor: 'pointer'}}
                                        >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                onClick={(event) => handleClick(event, row.id)}
                                                checked={isItemSelected}
                                                inputProps={{ 'aria-labelledby': labelId }}
                                            />
                                        </TableCell>
                                        <TableCell component="th" id={labelId} scope="row">
                                        {row.name}
                                        </TableCell>
                                        <TableCell>{row.symbol}</TableCell>
                                        <TableCell>{toCurrencyString(row.currentPrice)}</TableCell>
                                        <TableCell>{row.units}</TableCell>
                                        <TableCell>{toCurrencyString(row.marketValue)}</TableCell>
                                        </TableRow>
                                    );
                                }
                            )}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </div>
    );
}