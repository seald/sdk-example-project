import React, { useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Box, IconButton, ListSubheader, Typography } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import makeStyles from '@mui/styles/makeStyles'
import withStyles from '@mui/styles/withStyles'
import DeleteIcon from '@mui/icons-material/Delete'

import { SocketContext } from '../stores/SocketContext'
import RemoveDialogRoom from './RemoveDialogRoom'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    overflowY: 'auto',
    height: '100%'
  },
  headerList: {
    zIndex: 2, // Above badge login
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText
  }
}))

const SmallAvatar = withStyles(theme => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`
  }
}))(Avatar)

function ListCustomRooms () {
  const [{ currentUser, users, rooms }] = useContext(SocketContext)
  const classes = useStyles()
  const modal = useRef(null)

  return (
    <>
      <List
        className={classes.root}
        subheader={
          <ListSubheader
            className={classes.headerList}
            display='flex'
            component={Box}
            id='nested-list-subheader'
          >
            Rooms ({rooms.filter(r => !r.one2one).length})
          </ListSubheader>
      }
      >
        {rooms.filter(r => !r.one2one).map(room => {
          const owner = users.find(u => u.id === room.ownerId)
          const roomUsers = users
            .filter(user => user.id !== room.ownerId && room.users.some(id => id === user.id))
          const hasMultiUsers = roomUsers.length > 0
          return (
            <ListItem
              key={room.id}
              button
              component={Link}
              to={{
                pathname: `/rooms/${room.id}`
              }}
            >
              <ListItemAvatar>
                {hasMultiUsers
                  ? (
                    <Badge
                      overlap='circular'
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                      }}
                      badgeContent={<SmallAvatar
                        alt={roomUsers[0]?.name}
                        src={roomUsers[0]?.photoURL}
                                    />}
                    >
                      <Avatar
                        alt={owner?.name}
                        src={owner?.photoURL}
                      />
                    </Badge>
                    )
                  : (
                    <Avatar
                      alt={owner?.name}
                      src={owner?.photoURL}
                    />
                    )}
              </ListItemAvatar>
              <ListItemText
                id={room.id}
                primary={
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Typography>{room.name}</Typography>
                    {currentUser.id === owner?.id && (
                      <IconButton
                        edge='start'
                        size='small'
                        color='inherit'
                        aria-label='add room'
                        component='span'
                        onClick={e => {
                          e.preventDefault()
                          modal.current.openDialog(room)
                        }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    )}
                  </Box>
              }
              />
            </ListItem>
          )
        })}
      </List>
      <RemoveDialogRoom ref={modal} />
    </>
  )
}

export default ListCustomRooms
