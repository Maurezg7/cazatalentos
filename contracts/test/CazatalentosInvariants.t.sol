// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {Cazatalentos} from "../src/Cazatalentos.sol";
import {ICazatalentos} from "../src/ICazatalentos.sol";

contract Handler is Test {
    Cazatalentos public immutable caz;

    address[] public artists;
    address[] public supporters;
    uint256[] public poolIds;
    uint256[] public artistIds;

    mapping(uint256 => uint256) public poolAmountAtOpen;
    mapping(uint256 => uint256) public stakesDeposited;
    mapping(uint256 => uint256) public rewardsClaimed;
    mapping(uint256 => uint256) public reclaimedAmount;
    mapping(uint256 => uint256) public poolsCreatedByArtist;
    mapping(uint256 => uint256) public artistIdOfPool;

    uint256 public totalPoolsBaseline;
    uint256 public initialArtistsCount;
    uint256 public ghostActivePoolsSum;

    bytes32 internal constant MILESTONE = keccak256("inv-milestone");

    constructor(Cazatalentos caz_) {
        caz = caz_;

        for (uint256 i = 0; i < 3; ++i) {
            address artist = makeAddr(string(abi.encodePacked("inv-artist-", vm.toString(i))));
            vm.deal(artist, 100 ether);
            artists.push(artist);
            vm.prank(artist);
            uint256 artistId =
                caz.registerArtist(string(abi.encodePacked("ipfs://inv-artist-", vm.toString(i))));
            artistIds.push(artistId);
        }
        initialArtistsCount = artists.length;

        for (uint256 i = 0; i < 8; ++i) {
            address supporter = makeAddr(string(abi.encodePacked("inv-supporter-", vm.toString(i))));
            vm.deal(supporter, 10 ether);
            supporters.push(supporter);
        }

        totalPoolsBaseline = caz.totalPools();
    }

    function artistsLength() external view returns (uint256) {
        return artists.length;
    }

    function supportersLength() external view returns (uint256) {
        return supporters.length;
    }

    function poolIdsLength() external view returns (uint256) {
        return poolIds.length;
    }

    function sign(uint256 artistIdx, uint256 supporterIdx) external {
        artistIdx = artistIdx % artists.length;
        supporterIdx = supporterIdx % supporters.length;

        address artist = artists[artistIdx];
        address supporter = supporters[supporterIdx];
        if (supporter == artist) return;

        uint256 artistId = artistIds[artistIdx];
        if (caz.supporterOf(artistId, supporter).rank != 0) return;

        uint256 stake = caz.MIN_STAKE();
        if (supporter.balance < stake) return;

        vm.prank(supporter);
        (bool ok,) = address(caz).call{value: stake}(
            abi.encodeWithSelector(Cazatalentos.signBelief.selector, artistId)
        );
        if (ok) {
            stakesDeposited[artistId] += stake;
        }
    }

    function open(uint256 artistIdx, uint96 amount, uint64 duration) external {
        artistIdx = artistIdx % artists.length;
        amount = uint96(bound(amount, 0.001 ether, 5 ether));
        duration = uint64(bound(duration, 1, caz.MAX_POOL_DURATION()));

        address artist = artists[artistIdx];
        uint256 artistId = artistIds[artistIdx];
        if (artist.balance < amount) return;
        if (caz.artistOf(artistId).supporterCount == 0) return;

        uint64 deadline = uint64(block.timestamp + duration);
        vm.prank(artist);
        (bool ok, bytes memory ret) = address(caz).call{value: amount}(
            abi.encodeWithSelector(Cazatalentos.openPool.selector, artistId, MILESTONE, deadline)
        );
        if (ok) {
            uint256 poolId = abi.decode(ret, (uint256));
            poolIds.push(poolId);
            poolAmountAtOpen[poolId] = amount;
            artistIdOfPool[poolId] = artistId;
            poolsCreatedByArtist[artistId] += 1;
            ghostActivePoolsSum += 1;
        }
    }

    function claim(uint256 poolIdSeed) external {
        if (poolIds.length == 0) return;
        uint256 poolId = poolIds[poolIdSeed % poolIds.length];
        ICazatalentos.Pool memory p = caz.poolOf(poolId);
        address artist = caz.artistOf(p.artistId).owner;

        vm.prank(artist);
        (bool ok,) = address(caz)
            .call(
                abi.encodeWithSelector(
                    Cazatalentos.claimMilestone.selector, poolId, "ipfs://inv-evidence"
                )
            );
        ok;
    }

    function voteOn(uint256 poolIdSeed, uint256 supporterIdx, bool approve) external {
        if (poolIds.length == 0) return;
        uint256 poolId = poolIds[poolIdSeed % poolIds.length];
        supporterIdx = supporterIdx % supporters.length;
        address supporter = supporters[supporterIdx];

        vm.prank(supporter);
        (bool ok,) =
            address(caz).call(abi.encodeWithSelector(Cazatalentos.vote.selector, poolId, approve));
        ok;
    }

    function warpAndFinalize(uint256 poolIdSeed) external {
        if (poolIds.length == 0) return;
        uint256 poolId = poolIds[poolIdSeed % poolIds.length];
        ICazatalentos.Pool memory p = caz.poolOf(poolId);
        if (p.status != ICazatalentos.PoolStatus.Claimed) return;
        if (p.voteEnd == 0) return;

        vm.warp(uint256(p.voteEnd) + 1);
        (bool ok,) =
            address(caz).call(abi.encodeWithSelector(Cazatalentos.finalize.selector, poolId));
        if (ok) {
            ghostActivePoolsSum -= 1;
        }
    }

    function reward(uint256 poolIdSeed, uint256 supporterIdx) external {
        if (poolIds.length == 0) return;
        uint256 poolId = poolIds[poolIdSeed % poolIds.length];
        supporterIdx = supporterIdx % supporters.length;
        address supporter = supporters[supporterIdx];

        uint256 before = supporter.balance;
        vm.prank(supporter);
        (bool ok,) =
            address(caz).call(abi.encodeWithSelector(Cazatalentos.claimReward.selector, poolId));
        if (ok) {
            rewardsClaimed[poolId] += supporter.balance - before;
        }
    }

    function reclaim(uint256 poolIdSeed) external {
        if (poolIds.length == 0) return;
        uint256 poolId = poolIds[poolIdSeed % poolIds.length];
        ICazatalentos.Pool memory beforePool = caz.poolOf(poolId);
        address artist = caz.artistOf(beforePool.artistId).owner;
        bool wasExpiredOpen = beforePool.status == ICazatalentos.PoolStatus.Open
            && block.timestamp > beforePool.deadline;

        uint256 before = artist.balance;
        vm.prank(artist);
        (bool ok,) =
            address(caz).call(abi.encodeWithSelector(Cazatalentos.reclaimPool.selector, poolId));
        if (ok) {
            reclaimedAmount[poolId] += artist.balance - before;
            if (wasExpiredOpen) {
                ghostActivePoolsSum -= 1;
            }
        }
    }

    function unstake(uint256 artistIdx, uint256 supporterIdx) external {
        artistIdx = artistIdx % artists.length;
        supporterIdx = supporterIdx % supporters.length;

        uint256 artistId = artistIds[artistIdx];
        address supporter = supporters[supporterIdx];
        uint256 stakeBefore = caz.supporterOf(artistId, supporter).stake;
        if (stakeBefore == 0) return;

        vm.prank(supporter);
        (bool ok,) =
            address(caz).call(abi.encodeWithSelector(Cazatalentos.withdrawStake.selector, artistId));
        if (ok) {
            stakesDeposited[artistId] -= stakeBefore;
        }
    }
}

contract CazatalentosInvariantsTest is StdInvariant, Test {
    Cazatalentos internal caz;
    Handler internal handler;

    uint256 internal constant MIN_STAKE = 0.001 ether;
    uint64 internal constant VOTE_WINDOW = 48 hours;
    uint64 internal constant MAX_POOL_DURATION = 90 days;
    uint16 internal constant QUORUM_BPS = 2000;
    uint16 internal constant APPROVAL_BPS = 5000;

    function setUp() public {
        caz = new Cazatalentos(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, QUORUM_BPS, APPROVAL_BPS);
        handler = new Handler(caz);
        targetContract(address(handler));
    }

    function invariant_ContractBalanceCoversObligations() public view {
        uint256 poolObligations;
        uint256 len = handler.poolIdsLength();
        for (uint256 i = 0; i < len; ++i) {
            uint256 poolId = handler.poolIds(i);
            poolObligations += handler.poolAmountAtOpen(poolId) - handler.rewardsClaimed(poolId)
            - handler.reclaimedAmount(poolId);
        }

        uint256 stakeObligations;
        uint256 artistsLen = handler.artistsLength();
        for (uint256 i = 0; i < artistsLen; ++i) {
            stakeObligations += handler.stakesDeposited(handler.artistIds(i));
        }

        assertGe(address(caz).balance, poolObligations + stakeObligations);
    }

    function invariant_RewardsNeverExceedPoolAmount() public view {
        uint256 len = handler.poolIdsLength();
        for (uint256 i = 0; i < len; ++i) {
            uint256 poolId = handler.poolIds(i);
            assertLe(handler.rewardsClaimed(poolId), handler.poolAmountAtOpen(poolId));
        }
    }

    function invariant_StakedByArtistMatchesSupporterStakes() public view {
        uint256 artistsLen = handler.artistsLength();
        uint256 supportersLen = handler.supportersLength();
        for (uint256 i = 0; i < artistsLen; ++i) {
            uint256 artistId = handler.artistIds(i);
            uint256 sum;
            for (uint256 j = 0; j < supportersLen; ++j) {
                sum += caz.supporterOf(artistId, handler.supporters(j)).stake;
            }
            assertEq(caz.stakedByArtist(artistId), sum);
        }
    }

    function invariant_TotalPoolsMonotonic() public view {
        assertGe(caz.totalPools(), handler.totalPoolsBaseline());
    }

    function invariant_TotalArtistsMonotonic() public view {
        assertGe(caz.totalArtists(), handler.initialArtistsCount());
    }

    function invariant_ActivePoolsCountConsistent() public view {
        uint256 artistsLen = handler.artistsLength();
        for (uint256 i = 0; i < artistsLen; ++i) {
            uint256 artistId = handler.artistIds(i);
            uint256 active = caz.activePoolsByArtist(artistId);
            assertLe(active, handler.poolsCreatedByArtist(artistId));
        }
    }
}
