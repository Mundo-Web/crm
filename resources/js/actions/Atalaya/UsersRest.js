import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";

class UsersRest extends BasicRest {
    path = 'atalaya/users'

    invite = async (email) => {
        try {
            const { status, result } = await Fetch(`/api/${this.path}/invite`, {
                method: 'POST',
                body: JSON.stringify({ email })
            })
            if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
            return { status: true }
        } catch (error) {
            return { status: false, message: error.message }
        }
    }
}

export default UsersRest