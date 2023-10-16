import { Badge } from '@mui/material'

import withStyles from '@mui/styles/withStyles'

const AvatarLogged = withStyles(theme => ({
  badge: {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
  }
}))(Badge)

export default AvatarLogged
