import { DataTypes, Model, Sequelize, ValidationError } from 'sequelize'
import { hashPassword, parseHashedPassword } from './utils.js'
import Errors from './errors.js'
import config from './config.js'

const sequelize = new Sequelize(config.sequelize)

class User extends Model {
  async isValidPassword (password) {
    if (!this.hashedPassword) throw Errors.PASSWORD_UNSET
    const { salt } = parseHashedPassword(this.hashedPassword)
    const hashedPassword = await hashPassword(password, salt)
    return hashedPassword === this.hashedPassword
  }

  async setPassword (password) {
    this.hashedPassword = await hashPassword(password)
  }

  static async create ({ emailAddress, name, password, phoneNumber }) {
    return super.create({ emailAddress, name, hashedPassword: await hashPassword(password), phoneNumber })
  }

  async setSealdId (sealdId) {
    this.sealdId = sealdId
    await this.save()
  }

  serialize () {
    return {
      id: this.id,
      name: this.name,
      emailAddress: this.emailAddress,
      sealdId: this.sealdId,
      phoneNumber: this.phoneNumber
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    sealdId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailAddress: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
    },
    hashedPassword: {
      type: DataTypes.STRING
    },
    twoManRuleKey: {
      type: DataTypes.STRING
    }
  },
  { sequelize, modelName: 'User' }
)

class Room extends Model {
  static async createMultiUserRoom (ownerId, usersIds, name) {
    const room = await Room.create({ ownerId, name, one2one: false })
    await room.addUsers(usersIds.includes(ownerId) ? usersIds : [...usersIds, ownerId])
    await room.reload({ include: [User] })
    return room
  }

  static async createOne2OneRoom (ownerId, otherUserId) {
    const rooms = await Room.findAll({
      where: {
        one2one: true
      },
      include: [
        {
          model: User,
          where: {
            id: [otherUserId, ownerId]
          }
        },
        {
          model: User,
          as: 'owner',
          where: {
            id: [otherUserId, ownerId]
          }
        }]
    })

    const existingRoom = rooms.find(room => {
      const ids = room.Users.map(u => u.id)
      return !!(ids.includes(ownerId) && ids.includes(otherUserId)) // this checks that both members are present
    })

    if (existingRoom) throw new ValidationError('Cannot create two one2one rooms with the same users')

    const room = await Room.create({ ownerId, one2one: true })
    await room.addUsers([ownerId, otherUserId])
    return room
  }

  async editUsers (usersIds) {
    const currentUsersIds = (await this.getUsers()).map(u => u.id)
    const usersToAdd = usersIds.filter(id => !currentUsersIds.includes(id))
    const usersToDelete = currentUsersIds.filter(id => !usersIds.includes(id))
    if (usersToDelete.length) await this.removeUsers(usersToDelete)
    if (usersToAdd.length) await this.addUsers(usersToAdd)
    await this.reload()
    return {
      usersDeleted: usersToDelete,
      usersAdded: usersToAdd
    }
  }

  serialize () {
    return {
      id: this.id,
      users: this.Users.map(u => u.id),
      one2one: this.one2one,
      name: this.name,
      ownerId: this.ownerId
    }
  }
}

Room.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: '',
    allowNull: false
  },
  one2one: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, { sequelize, modelName: 'Room' })

class Message extends Model {
  serialize () {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      content: this.content,
      senderId: this.senderId,
      roomId: this.roomId,
      uploadId: this.uploadId
    }
  }
}

Message.init({
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize, modelName: 'Message' })

const Upload = sequelize.define('Upload', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING
  }
})

const UserRoom = sequelize.define('UserRoom', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  }
})

User.belongsToMany(Room, { through: UserRoom })
Room.belongsToMany(User, { through: UserRoom })

User.hasMany(UserRoom)
UserRoom.belongsTo(User)
Room.hasMany(UserRoom)
UserRoom.belongsTo(Room)

Room.hasMany(Message, { foreignKey: 'roomId' })
Room.belongsTo(User, { as: 'owner' })

Message.belongsTo(Room, { as: 'room' })
Message.belongsTo(User, { as: 'sender' })
Message.belongsTo(Upload, { as: 'upload' })

sequelize.sync()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

export { User, Room, Message, UserRoom, Upload, sequelize, ValidationError }
