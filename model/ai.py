import numpy as np
from model.game import Grid
import itertools

def get_grid(tiles,directions):
    g = Grid()
    g.tiles = tiles.copy()
    for direction in directions:
        g.run(direction)
        g.add_random_tile()
    return g.tiles

def printf(tiles):
    for row in tiles:
        for i in row:
            print("{:^6}".format(i),end='')
        print()

def my_log2(z):
    if z==0:
        return 0
    else:
        return z
        # return np.math.log2(z)


class Ai:
    def __init__(self):
        self.g = Grid()

    def get_next(self,tiles):
        score_list = []
        kn = min(max(self.get_tile_num(tiles)**2,20),40)
        for directions in itertools.product("ULRD", repeat=3):
            fen = []
            for i in range(kn):
                t_g = get_grid(tiles,directions)
                fen.append(self.get_score(t_g))
            score_list.append([directions,min(fen)])
        score_list = sorted(score_list, key=(lambda x: [x[1]]))
        # print(score_list)
        for d in score_list[::-1]:
            self.g.tiles = tiles.copy()
            if self.g.run(d[0][0],is_fake=True)!=0:
                self.g.run(d[0][0])
                return d[0][0],d[1]/kn
        # print('===',score_list[-1][0][0])
        return score_list[-1][0][0],score_list[-1][1]/kn

    def get_score(self,tiles):
        # 格子数量(越少越好)  金角银边（）
        return self.get_bj2(tiles)*2.5+self.get_bj(tiles)
        # return self.get_bj(tiles)

    def debug(self,tiles):
        print('\n=======开始判断========')
        print('移动前棋盘：')
        printf(tiles)
        score_list = []
        for directions in itertools.product("ULRD",repeat= 2):
            t_g = get_grid(tiles, directions)
            fen = self.get_score(t_g)
            score_list.append([directions, fen])
            print('==={}=={}=='.format(directions,fen))
            printf(t_g)
        score_list = sorted(score_list, key=(lambda x: [x[1]]))
        # print(score_list)
        for d in score_list[::-1]:
            # print('-->',d)
            self.g.tiles = tiles.copy()
            # print(self.g.run(d[0][0],is_fake=True))
            if self.g.run(d[0][0], is_fake=True) != 0:
                # print('---异动前：')
                # print(self.g.tiles)
                # print('---异动后：')
                self.g.run(d[0][0])
                # print(self.g.tiles)
                return d[0][0]
        # print('===',score_list[-1][0][0])
        return score_list[-1][0][0]

    # 空格子数量
    def get_tile_num(self,tiles):
        # l = len(tiles)
        n=0
        for row in tiles:
            for i in row:
                if i == 0:
                    n+=1
        return n
        # return np.bincount(tiles)[0]

    def get_bj(self,tiles):
        bj=0
        l = len(tiles)
        for y in range(l):
            for x in range(l):
                z = tiles[y][x]
                if z!=0:
                    # z_log = np.math.log2(z)-1
                    z_log = z - 2
                    bj+=z_log*(x+y-3)
                else:
                    bj+=(100-20*(x+y-3))
        return bj

    def get_bj2(self,tiles):
        bj = 0
        l = len(tiles)
        for y in range(l-1,0,-1):
            for x in range(l-1,0,-1):
                z = tiles[y][x]
                if tiles[y][x]<tiles[y][x-1]:
                    bj -= abs(my_log2(tiles[y][x-1])-z)
                if tiles[y][x]<tiles[y-1][x]:
                    bj -= abs(my_log2(tiles[y-1][x])-z)
                if tiles[y][x]<tiles[y-1][x-1]:
                    bj -= abs(my_log2(tiles[y-1][x-1])-z)
        return bj

if __name__ == '__main__':
    ai = Ai()
    tiles = np.array([
        [0,0,0,0],
        [0,0,0,2],
        [0,4,32,0],
        [0,0,64,32],
    ])
    f = ai.debug(tiles)
    print(f)
