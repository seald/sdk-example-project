import type { FC } from 'react'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import { type User } from '../services/api.ts'

const GroupAvatars: FC<{ users: User[], max?: number }> = ({ users, max = 3 }) => (
  <AvatarGroup max={max}>
    {users.map(user => (
      <Avatar key={user.id} alt={user.name}/>
    ))}
  </AvatarGroup>
)
export default GroupAvatars
