// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {Cazatalentos} from "../src/Cazatalentos.sol";
import {ICazatalentos} from "../src/ICazatalentos.sol";

/// @notice Interacción real fan + artista en Monad testnet (demo).
/// Artista = DEPLOYER_PRIVATE_KEY (owner de artistId 1).
/// Fan = clave efímera fondeada por el artista.
contract DemoFanArtist is Script {
    uint256 constant ARTIST_ID = 1;
    uint256 constant POOL_AMOUNT = 0.01 ether;
    uint256 constant FAN_FUND = 0.005 ether;

    function _key(string memory name) internal view returns (uint256) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        require(b.length > 0, string.concat("missing ", name));
        if (b.length < 2 || b[0] != "0" || b[1] != "x") {
            raw = string.concat("0x", raw);
        }
        return vm.parseUint(raw);
    }

    function run() external {
        address cazAddr = vm.envAddress("CAZATALENTOS_ADDRESS");
        uint256 artistKey = _key("DEPLOYER_PRIVATE_KEY");
        uint256 fanKey = uint256(keccak256(abi.encodePacked("cazatalentos-demo-fan", block.chainid)));

        address artist = vm.addr(artistKey);
        address fan = vm.addr(fanKey);
        Cazatalentos caz = Cazatalentos(payable(cazAddr));

        ICazatalentos.Artist memory a = caz.artistOf(ARTIST_ID);
        require(a.exists, "artist 1 missing");
        require(a.owner == artist, "deployer is not owner of artist 1");
        require(fan != artist, "fan and artist collided");

        console2.log("artist", artist);
        console2.log("fan", fan);
        console2.log("supporters before", a.supporterCount);

        // --- FAN: fondeo + dejar marca ---
        ICazatalentos.Supporter memory s = caz.supporterOf(ARTIST_ID, fan);
        if (s.rank == 0) {
            uint256 minStake = caz.MIN_STAKE();
            vm.startBroadcast(artistKey);
            (bool ok,) = payable(fan).call{value: FAN_FUND}("");
            require(ok, "fund fan failed");
            vm.stopBroadcast();

            vm.startBroadcast(fanKey);
            caz.signBelief{value: minStake}(ARTIST_ID);
            vm.stopBroadcast();
            console2.log("fan signed belief");
        } else {
            console2.log("fan already signed rank", s.rank);
        }

        a = caz.artistOf(ARTIST_ID);
        require(a.supporterCount > 0, "need supporters to open pool");

        // --- ARTISTA: abrir pozo (si no hay uno activo) ---
        uint256 existing = caz.activePoolsByArtist(ARTIST_ID);
        if (existing != 0) {
            console2.log("active pool already", existing);
            return;
        }

        uint64 deadline = uint64(block.timestamp + 30 days);
        bytes32 milestone = keccak256(bytes("Demo live: pena abierta en el valle"));

        vm.startBroadcast(artistKey);
        caz.openPool{value: POOL_AMOUNT}(ARTIST_ID, milestone, deadline);
        vm.stopBroadcast();

        uint256 poolId = caz.activePoolsByArtist(ARTIST_ID);
        console2.log("opened poolId", poolId);
        console2.log("supporters after", a.supporterCount);
    }
}
