import {
  ForumEntities,
  forumReducer,
  forumActionCreators,
  forumEmptyState,
  ForumState,
} from './test-cases/forum';

export function deepFreeze(o: any) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach(function(prop) {
    if (
      o.hasOwnProperty(prop) &&
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}

describe('index', () => {
  describe('add', () => {
    /*
    basic
      create resource
      create resource at index
      if id exists, do not create the resource

    with attribute data
      add resource with non-rel attribute data
      ignore rel attribute data

    with attachables
      resolve rel from entity
        resolvable entity
        non-resolvable, entity not related
        non-resolvable, entity related via multiple rels
      cardinality
        rel of one-cardinality
          if attachable resource does not exist, then do nothing
          a single attachable
            set rel value to attachable id
            if no reciprocal rel key on attachable resource, then set key and value
            ignore index
          multiple attachables: overwrite each time

        rel of many-cardinality
          a single attachable
            if no reciprocal index, then append to attachable
            if reciprocal index, then insert in attachable
            if no reciprocal rel key on attachable resource, then set key and value
          multiple attachables: append/insert each
    */

    describe('basic', () => {
      test('create resource', () => {
        const result = forumReducer(
          forumEmptyState,
          forumActionCreators.add(ForumEntities.ACCOUNT, 'a1')
        );

        const expected: ForumState = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('create resource at index', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
              a2: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1', 'a2'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.add(ForumEntities.ACCOUNT, 'a3', {}, undefined, 1)
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
              a2: {},
              a3: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1', 'a3', 'a2'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('if id exists, then do not create the resource', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: undefined },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.add(ForumEntities.ACCOUNT, 'a1')
        );

        expect(result).toEqual(state);
      });
    });

    describe('with attribute data', () => {
      test('add resource with non-rel attribute data', () => {
        const result = forumReducer(
          forumEmptyState,
          forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {
            email: 'a@b.c',
          })
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { email: 'a@b.c' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('ignore rel attribute data', () => {
        const result = forumReducer(
          forumEmptyState,
          forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {
            profileId: 'invalidData!',
          })
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('with attachables', () => {
      describe('resolve rel from entity', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: { a1: {} },
            profile: { p1: {} },
            post: { o1: {} },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1'],
          },
        };

        /*
        resolvable entity
        non-resolvable, entity not related
        non-resolvable, entity related via multiple rels
        */

        test('resolvable', () => {
          const result = forumReducer(
            state,
            forumActionCreators.add(ForumEntities.POST, 'o200', {}, [
              { rel: ForumEntities.PROFILE, id: 'p1' },
            ])
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: { a1: {} },
              profile: {
                p1: { postIds: ['o200'] },
              },
              post: {
                o1: {},
                o200: { profileId: 'p1' },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
              post: ['o1', 'o200'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('non-resolvable because entity not related', () => {
          const result = forumReducer(
            state,
            forumActionCreators.add(ForumEntities.POST, 'o200', {}, [
              { rel: ForumEntities.ACCOUNT, id: 'a1' },
            ])
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: { a1: {} },
              profile: { p1: {} },
              post: {
                o1: {},
                o200: {},
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
              post: ['o1', 'o200'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('non-resolvable because entity is related via multiple rels', () => {
          const result = forumReducer(
            state,
            forumActionCreators.add(ForumEntities.POST, 'o200', {}, [
              { rel: ForumEntities.POST, id: 'o1' },
            ])
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: { a1: {} },
              profile: { p1: {} },
              post: {
                o1: {},
                o200: {},
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
              post: ['o1', 'o200'],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('cardinality', () => {
        describe('rel of one-cardinality', () => {
          test('if attachable resource does not exist, then do nothing', () => {
            const state = {
              resources: {
                ...forumEmptyState.resources,
                account: {
                  a1: { profileId: undefined },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                account: ['a1'],
              },
            };

            const result = forumReducer(
              state,
              forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {}, [
                {
                  rel: 'profileId',
                  id: 'p1',
                },
              ])
            );

            expect(result).toEqual(state);
          });

          describe('a single attachable', () => {
            const expected = {
              resources: {
                ...forumEmptyState.resources,
                account: {
                  a1: { profileId: 'p1' },
                },
                profile: {
                  p1: { accountId: 'a1' },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                account: ['a1'],
                profile: ['p1'],
              },
            };

            test('set rel value to attachable id', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  profile: {
                    p1: { accountId: undefined },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  profile: ['p1'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {}, [
                  {
                    rel: 'profileId',
                    id: 'p1',
                  },
                ])
              );

              expect(result).toEqual(expected);
            });

            test('if no reciprocal rel key on attachable resource, then set key and value', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  profile: {
                    p1: {},
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  profile: ['p1'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {}, [
                  {
                    rel: 'profileId',
                    id: 'p1',
                  },
                ])
              );

              expect(result).toEqual(expected);
            });

            test('ignore index', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  profile: {
                    p1: { accountId: undefined },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  profile: ['p1'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {}, [
                  {
                    rel: 'profileId',
                    id: 'p1',
                    index: 3,
                    reciprocalIndex: 2, // reciprocal happens to be cardinality of one in this test
                  },
                ])
              );

              expect(result).toEqual(expected);
            });
          });

          test('multiple attachables: overwrite each time', () => {
            const state = {
              resources: {
                ...forumEmptyState.resources,
                profile: {
                  p1: { accountId: undefined },
                  p2: { accountId: undefined },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                profile: ['p1', 'p2'],
              },
            };

            const result = forumReducer(
              state,
              forumActionCreators.add(ForumEntities.ACCOUNT, 'a1', {}, [
                { rel: 'profileId', id: 'p1' },
                { rel: 'profileId', id: 'p2' },
              ])
            );

            const expected = {
              resources: {
                ...forumEmptyState.resources,
                account: {
                  a1: { profileId: 'p2' },
                },
                profile: {
                  p1: { accountId: undefined },
                  p2: { accountId: 'a1' },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                account: ['a1'],
                profile: ['p1', 'p2'],
              },
            };

            expect(result).toEqual(expected);
          });
        });

        describe('rel of many-cardinality', () => {
          describe('a single attachable', () => {
            test('if no reciprocal index, then append to attachable', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                      categoryIds: ['c1'],
                    },
                  },
                  category: {
                    c1: { postIds: ['o1'] },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  post: ['o1'],
                  category: ['c1'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.CATEGORY, 'c200', {}, [
                  { rel: 'postIds', id: 'o1' },
                ])
              );

              const expected = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                      categoryIds: ['c1', 'c200'],
                    },
                  },
                  category: {
                    c1: { postIds: ['o1'] },
                    c200: { postIds: ['o1'] },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  post: ['o1'],
                  category: ['c1', 'c200'],
                },
              };

              expect(result).toEqual(expected);
            });

            test('if reciprocal index, then insert in attachable', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                      categoryIds: ['c1', 'c2'],
                    },
                  },
                  category: {
                    c1: { postIds: ['o1'] },
                    c2: { postIds: ['o1'] },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  post: ['o1'],
                  category: ['c1', 'c2'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.CATEGORY, 'c200', {}, [
                  { rel: 'postIds', id: 'o1', reciprocalIndex: 1 },
                ])
              );

              const expected = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                      categoryIds: ['c1', 'c200', 'c2'],
                    },
                  },
                  category: {
                    c1: { postIds: ['o1'] },
                    c2: { postIds: ['o1'] },
                    c200: { postIds: ['o1'] },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  post: ['o1'],
                  category: ['c1', 'c2', 'c200'],
                },
              };

              expect(result).toEqual(expected);
            });

            test('if no reciprocal rel key on attachable resource, then set key and value', () => {
              const state = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                    },
                  },
                },
                ids: {
                  post: ['o1'],
                },
              };

              const result = forumReducer(
                state,
                forumActionCreators.add(ForumEntities.CATEGORY, 'c1', {}, [
                  { rel: 'postIds', id: 'o1' },
                ])
              );

              const expected = {
                resources: {
                  ...forumEmptyState.resources,
                  post: {
                    o1: {
                      profileId: undefined,
                      categoryIds: ['c1'],
                    },
                  },
                  category: {
                    c1: { postIds: ['o1'] },
                  },
                },
                ids: {
                  ...forumEmptyState.ids,
                  post: ['o1'],
                  category: ['c1'],
                },
              };

              expect(result).toEqual(expected);
            });
          });

          test('multiple attachables: append/insert each', () => {
            const state = {
              resources: {
                ...forumEmptyState.resources,
                post: {
                  o1: {
                    profileId: undefined,
                    categoryIds: [],
                  },
                  o2: {
                    profileId: undefined,
                    categoryIds: ['c1', 'c2'],
                  },
                },
                category: {
                  c1: { postIds: ['o2'] },
                  c2: { postIds: ['o2'] },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                post: ['o1', 'o2'],
                category: ['c1', 'c2'],
              },
            };

            const result = forumReducer(
              state,
              forumActionCreators.add(ForumEntities.CATEGORY, 'c200', {}, [
                { rel: 'postIds', id: 'o1', index: 1 },
                { rel: 'postIds', id: 'o2', index: 0, reciprocalIndex: 1 },
              ])
            );

            const expected = {
              resources: {
                ...forumEmptyState.resources,
                post: {
                  o1: {
                    profileId: undefined,
                    categoryIds: ['c200'],
                  },
                  o2: {
                    profileId: undefined,
                    categoryIds: ['c1', 'c200', 'c2'],
                  },
                },
                category: {
                  c1: { postIds: ['o2'] },
                  c2: { postIds: ['o2'] },
                  c200: { postIds: ['o2', 'o1'] },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                post: ['o1', 'o2'],
                category: ['c1', 'c2', 'c200'],
              },
            };

            expect(result).toEqual(expected);
          });
        });
      });
    });
  });

  describe('remove', () => {
    /*
    without attached
      if id exists, then remove resource
      if id does not exist, then do nothing

    detach all existing attached resources
      detach resource of reciprocal one-cardinality
      detach resource of reciprocal many-cardinality

    with removal schema
      basic

      self-referencing

    */

    describe('without attached', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: undefined },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
        },
      };

      test('if id exists, then remove resource', () => {
        const result = forumReducer(
          state,
          forumActionCreators.remove(ForumEntities.ACCOUNT, 'a1')
        );

        expect(result).toEqual(forumEmptyState);
      });

      test('if id does not exist, then do nothing', () => {
        const result = forumReducer(
          state,
          forumActionCreators.remove(ForumEntities.ACCOUNT, 'a9000')
        );

        expect(result).toEqual(state);
      });
    });

    describe('detach all existing attached resources', () => {
      test('detach resource of reciprocal one-cardinality', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: 'p1' },
            },
            profile: {
              p1: {
                accountId: 'a1',
                postIds: ['o1', 'o2'],
              },
            },
            post: {
              o1: { profileId: 'p1', categoryIds: [] },
              o2: { profileId: 'p1', categoryIds: [] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1', 'o2'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.remove(ForumEntities.PROFILE, 'p1')
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: undefined },
            },
            post: {
              o1: {
                profileId: undefined,
                categoryIds: [],
              },
              o2: {
                profileId: undefined,
                categoryIds: [],
              },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            post: ['o1', 'o2'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('detach resource of reciprocal many-cardinality', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            profile: {
              p1: { postIds: ['o1', 'o2', 'o3'] },
            },
            post: {
              o1: { profileId: 'p1', categoryIds: [] },
              o2: { profileId: 'p1', categoryIds: ['c1'] },
              o3: { profileId: 'p1', categoryIds: [] },
            },
            category: {
              c1: { postIds: ['o2'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            profile: ['p1'],
            post: ['o1', 'o2', 'o3'],
            category: ['c1'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.remove(ForumEntities.POST, 'o2')
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            profile: {
              p1: { postIds: ['o1', 'o3'] },
            },
            post: {
              o1: { profileId: 'p1', categoryIds: [] },
              o3: { profileId: 'p1', categoryIds: [] },
            },
            category: {
              c1: { postIds: [] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            profile: ['p1'],
            post: ['o1', 'o3'],
            category: ['c1'],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('with removal schema', () => {
      describe('basic', () => {
        const state = {
          resources: {
            account: {
              a1: { profileId: 'p1' },
              a2: { profileId: 'p2' },
            },
            profile: {
              p1: { postIds: ['o1', 'o2'] },
              p2: { postIds: ['o3'] },
            },
            post: {
              o1: { profileId: 'p1', tagIds: ['t1'], categoryIds: ['c1'] },
              o2: { profileId: 'p1', categoryIds: ['c1'] },
              o3: { profileId: 'p2', tagIds: ['t2'], categoryIds: ['c1'] },
            },
            tag: {
              t1: { postIds: ['o1'] },
              t2: { postIds: ['o3'] },
            },
            category: {
              c1: { postIds: ['o1', 'o2', 'o3'] },
            },
          },
          ids: {
            account: ['a1', 'a2'],
            profile: ['p1', 'p2'],
            post: ['o1', 'o2', 'o3'],
            tag: ['t1', 't2'],
            category: ['c1'],
          },
        };

        const expected = {
          resources: {
            account: {
              a2: { profileId: 'p2' },
            },
            profile: {
              p2: { postIds: ['o3'] },
            },
            post: {
              o3: { profileId: 'p2', tagIds: ['t2'], categoryIds: ['c1'] },
            },
            tag: {
              t2: { postIds: ['o3'] },
            },
            category: {
              c1: { postIds: ['o3'] },
            },
          },
          ids: {
            account: ['a2'],
            profile: ['p2'],
            post: ['o3'],
            tag: ['t2'],
            category: ['c1'],
          },
        };

        test('without resolving rel from entity', () => {
          const result = forumReducer(
            state,
            forumActionCreators.remove(ForumEntities.ACCOUNT, 'a1', {
              profileId: {
                postIds: {
                  tagIds: {},
                },
              },
            })
          );

          expect(result).toEqual(expected);
        });

        test('with resolving rel from entity', () => {
          const result = forumReducer(
            state,
            forumActionCreators.remove(ForumEntities.ACCOUNT, 'a1', {
              profile: {
                post: {
                  tag: {},
                },
              },
            })
          );

          expect(result).toEqual(expected);
        });
      });

      describe('self-referencing', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { childIds: ['o1.1', 'o1.2'] },
              'o1.1': { parentId: 'o1', childIds: ['o1.1.1', 'o1.1.2'] },
              'o1.1.1': { parentId: 'o1.1' },
              'o1.1.2': { parentId: 'o1.1' },
              'o1.2': { parentId: 'o1' },
              o2: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1', 'o1.1', 'o1.1.1', 'o1.1.2', 'o1.2', 'o2'],
          },
        };

        test('without resolving rel from entity', () => {
          const removalSchema = () => ({ childIds: removalSchema });

          const result = forumReducer(
            state,
            forumActionCreators.remove(ForumEntities.POST, 'o1', removalSchema)
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: { o2: {} },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o2'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('does not cascade when resolving rel from entity', () => {
          const removalSchema = () => ({ post: removalSchema });

          const result = forumReducer(
            state,
            forumActionCreators.remove(ForumEntities.POST, 'o1', removalSchema)
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                'o1.1': { parentId: undefined, childIds: ['o1.1.1', 'o1.1.2'] },
                'o1.1.1': { parentId: 'o1.1' },
                'o1.1.2': { parentId: 'o1.1' },
                'o1.2': { parentId: undefined },
                o2: {},
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1.1', 'o1.1.1', 'o1.1.2', 'o1.2', 'o2'],
            },
          };

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('edit', () => {
    /*
    edit only non-rel resource attributes
    ignore nonexistent resource
    */

    const state = {
      resources: {
        ...forumEmptyState.resources,
        profile: {
          p1: {
            postIds: ['o1'],
          },
        },
        post: {
          o1: {
            title: 'Foo',
            body: 'Lorem ipsum',
            profileId: 'p1',
            postIds: ['o1'],
          },
        },
        category: {
          c1: { postIds: ['o1'] },
        },
      },
      ids: {
        ...forumEmptyState.ids,
        profile: ['p1'],
        post: ['o1'],
        category: ['c1'],
      },
    };

    test('edit only non-rel resource attributes', () => {
      const result = forumReducer(
        state,
        forumActionCreators.edit(ForumEntities.POST, 'o1', {
          title: 'Bar',
          caption: 'Foobar',
          body: undefined,
          profileId: 'p9000',
          categoryIds: ['c9000'],
        })
      );

      const expected = {
        resources: {
          ...forumEmptyState.resources,
          profile: {
            p1: {
              postIds: ['o1'],
            },
          },
          post: {
            o1: {
              title: 'Bar',
              caption: 'Foobar',
              body: undefined,
              profileId: 'p1',
              postIds: ['o1'],
            },
          },
          category: {
            c1: { postIds: ['o1'] },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          profile: ['p1'],
          post: ['o1'],
          category: ['c1'],
        },
      };

      expect(result).toEqual(expected);
    });

    test('ignore non-existent resource', () => {
      const result = forumReducer(
        state,
        forumActionCreators.edit(ForumEntities.PROFILE, 'o9000', {
          title: 'abc123',
        })
      );

      expect(result).toEqual(state);
    });
  });

  describe('move', () => {
    test('move resource', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: { a1: {}, a200: {}, a3: {}, a4: {}, a5: {} },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1', 'a200', 'a3', 'a4', 'a5'],
        },
      };

      const result = forumReducer(
        state,
        forumActionCreators.move(ForumEntities.ACCOUNT, 1, 3)
      );

      const expected = {
        resources: {
          ...forumEmptyState.resources,
          account: { a1: {}, a200: {}, a3: {}, a4: {}, a5: {} },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1', 'a3', 'a4', 'a200', 'a5'],
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('attach', () => {
    /*
    cardinality
      rel of one-cardinality
        set rel value to id
        if no resource rel key, then set key and value
        ignore index

      rel of many-cardinality
        if no index, then append
        if index, then insert
        if no resource rel key, then set key and value,
        if already attached, then do nothing

    resolve rel from entity
      resolvable entity
      non-resolvable, entity not related
      non-resolvable, entity related via multiple rels

    if base resource does not exist, then do nothing
    if partially attached (invalid state), then fix the attachment
    */

    describe('cardinality', () => {
      describe('rel of one-cardinality', () => {
        test('set rel value to id', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: undefined },
              },
              profile: {
                p1: { accountId: undefined },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1'
            )
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: 'p1' },
              },
              profile: {
                p1: { accountId: 'a1' },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('if no resource rel key, then set key and value', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: {},
              },
              profile: {
                p1: {},
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1'
            )
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: 'p1' },
              },
              profile: {
                p1: { accountId: 'a1' },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('ignore index', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: undefined },
              },
              profile: {
                p1: { accountId: undefined },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1',
              { index: 1, reciprocalIndex: 2 }
            )
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: 'p1' },
              },
              profile: {
                p1: { accountId: 'a1' },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('rel of many-cardinality', () => {
        test('if no index, then append', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: ['c1'] },
              },
              category: {
                c1: { postIds: ['o1'] },
                c2: { postIds: [] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1', 'c2'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              'c2'
            )
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: ['c1', 'c2'] },
              },
              category: {
                c1: { postIds: ['o1'] },
                c2: { postIds: ['o1'] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1', 'c2'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('if index, then insert', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: ['c1', 'c2'] },
              },
              category: {
                c1: { postIds: ['o1'] },
                c2: { postIds: ['o1'] },
                c3: { postIds: [] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1', 'c2', 'c3'],
            },
          };

          [
            forumReducer(
              state,
              forumActionCreators.attach(
                ForumEntities.POST,
                'o1',
                'categoryIds',
                'c3',
                { index: 1 }
              )
            ),
            forumReducer(
              state,
              forumActionCreators.attach(
                ForumEntities.CATEGORY,
                'c3',
                'postIds',
                'o1',
                { reciprocalIndex: 1 }
              )
            ),
          ].forEach(result => {
            const expected = {
              resources: {
                ...forumEmptyState.resources,
                post: {
                  o1: { categoryIds: ['c1', 'c3', 'c2'] },
                },
                category: {
                  c1: { postIds: ['o1'] },
                  c2: { postIds: ['o1'] },
                  c3: { postIds: ['o1'] },
                },
              },
              ids: {
                ...forumEmptyState.ids,
                post: ['o1'],
                category: ['c1', 'c2', 'c3'],
              },
            };

            expect(result).toEqual(expected);
          });
        });

        test('if no resource rel key, then set key and value', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: {},
              },
              category: {
                c1: {},
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              'c1'
            )
          );

          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: ['c1'] },
              },
              category: {
                c1: { postIds: ['o1'] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1'],
            },
          };

          expect(result).toEqual(expected);
        });

        test('if already attached, then do nothing', () => {
          const state = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: ['c1'] },
              },
              category: {
                c1: { postIds: ['o1'] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1'],
            },
          };

          const result = forumReducer(
            state,
            forumActionCreators.attach(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              'c1'
            )
          );

          expect(result).toEqual(state);
        });
      });
    });

    describe('resolve rel from entity', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: { a1: {} },
          profile: { p1: {} },
          post: {
            o1: {},
            o2: {},
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
          profile: ['p1'],
          post: ['o1', 'o2'],
        },
      };

      test('resolvable entity', () => {
        const result = forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.POST,
            'o1',
            ForumEntities.PROFILE,
            'p1'
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: { a1: {} },
            profile: { p1: { postIds: ['o1'] } },
            post: {
              o1: { profileId: 'p1' },
              o2: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1', 'o2'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('non-resolvable, entity not related', () => {
        const result = forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.POST,
            'o1',
            ForumEntities.ACCOUNT,
            'a1'
          )
        );

        expect(result).toEqual(state);
      });

      test('non-resolvable, entity related via multiple rels', () => {
        const result = forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.POST,
            'o1',
            ForumEntities.POST,
            'o2'
          )
        );

        expect(result).toEqual(state);
      });
    });

    test('if either resource does not exist, then do nothing', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: undefined },
          },
          profile: {
            p1: { accountId: undefined },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
          profile: ['p1'],
        },
      };

      [
        forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.ACCOUNT,
            'a1',
            'profileId',
            'p9000'
          )
        ),
        forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.PROFILE,
            'p1',
            'accountId',
            'a9000'
          )
        ),
      ].forEach(result => expect(result).toEqual(state));
    });

    test('if partially attached (invalid state), then fix the attachment', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: 'p1' },
          },
          profile: {
            p1: { accountId: undefined },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
          profile: ['p1'],
        },
      };

      [
        forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.ACCOUNT,
            'a1',
            'profileId',
            'p1'
          )
        ),
        forumReducer(
          state,
          forumActionCreators.attach(
            ForumEntities.PROFILE,
            'p1',
            'accountId',
            'a1'
          )
        ),
      ].forEach(result => {
        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: 'p1' },
            },
            profile: {
              p1: { accountId: 'a1' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
          },
        };

        expect(result).toEqual(expected);
      });
    });
  });

  describe('detach', () => {
    /*
    basic
      one-cardinality
      many-cardinality

    resolve rel from entity
      resolvable entity
      non-resolvable, entity related via multiple rels

    if resource does not exist, then do nothing
    if attachment does not exist then do nothing

    if partially attached (invalid state), then still remove it completely
      when only one resource exists
      when both exist but only one is attached

    */

    describe('basic', () => {
      test('one-cardinality', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: 'p1' },
            },
            profile: {
              p1: { accountId: 'a1' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
          },
        };

        [
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1'
            )
          ),
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.PROFILE,
              'p1',
              'accountId',
              'a1'
            )
          ),
        ].forEach(result => {
          const expected = {
            resources: {
              ...forumEmptyState.resources,
              account: {
                a1: { profileId: undefined },
              },
              profile: {
                p1: { accountId: undefined },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              account: ['a1'],
              profile: ['p1'],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      test('many-cardinality', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c1', 'c2', 'c3'] },
            },
            category: {
              c2: { postIds: ['o1'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
            category: ['c2'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.POST,
            'o1',
            'categoryIds',
            'c2'
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c1', 'c3'] },
            },
            category: {
              c2: { postIds: [] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
            category: ['c2'],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    /*
    resolve rel from entity
      resolvable entity
      non-resolvable, entity related via multiple rels
    */
    describe('resolve rel from entity', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          profile: {
            p1: { postIds: ['o1'] },
          },
          post: {
            o1: { profileId: 'p1', childIds: ['o2'] },
            o2: { parentId: 'o1' },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          profile: ['p1'],
          post: ['o1', 'o2'],
        },
      };

      test('resolvable entity', () => {
        const result = forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.POST,
            'o1',
            ForumEntities.PROFILE,
            'p1'
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            profile: {
              p1: { postIds: [] },
            },
            post: {
              o1: { profileId: undefined, childIds: ['o2'] },
              o2: { parentId: 'o1' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            profile: ['p1'],
            post: ['o1', 'o2'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('non-resolvable, entity related via multiple rels', () => {
        const result = forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.POST,
            'o1',
            ForumEntities.POST,
            'o2'
          )
        );

        expect(result).toEqual(state);
      });
    });

    test('if resource does not exist, then do nothing', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: 'p1' },
          },
          profile: {
            p1: { accountId: 'a1' },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
          profile: ['p1'],
        },
      };

      [
        forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.ACCOUNT,
            'a9000',
            'profileId',
            'p1'
          )
        ),
        forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.PROFILE,
            'p9000',
            'accountId',
            'a1'
          )
        ),
      ].forEach(result => {
        expect(result).toEqual(state);
      });
    });

    test('if attachment does not exist then do nothing', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: 'p1' },
            a200: { profileId: undefined },
          },
          profile: {
            p1: { accountId: 'a1' },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1', 'a200'],
          profile: ['p1'],
        },
      };

      [
        forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.ACCOUNT,
            'a200',
            'profileId',
            'p1'
          )
        ),
        forumReducer(
          state,
          forumActionCreators.detach(
            ForumEntities.PROFILE,
            'p1',
            'accountId',
            'a200'
          )
        ),
      ].forEach(result => {
        expect(result).toEqual(state);
      });
    });

    describe('if partially attached (invalid state), then still remove it completely', () => {
      test('when only one resource exists', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c1'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
          },
        };

        [
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              'c1'
            )
          ),
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.CATEGORY,
              'c1',
              'postIds',
              'o1'
            )
          ),
        ].forEach(result => {
          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: [] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      test('when both exist but only one is attached', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c1'] },
            },
            category: {
              c1: { postIds: [] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
            category: ['c1'],
          },
        };

        [
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              'c1'
            )
          ),
          forumReducer(
            state,
            forumActionCreators.detach(
              ForumEntities.CATEGORY,
              'c1',
              'postIds',
              'o1'
            )
          ),
        ].forEach(result => {
          const expected = {
            resources: {
              ...forumEmptyState.resources,
              post: {
                o1: { categoryIds: [] },
              },
              category: {
                c1: { postIds: [] },
              },
            },
            ids: {
              ...forumEmptyState.ids,
              post: ['o1'],
              category: ['c1'],
            },
          };

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('move attached id', () => {
    /*
    move attached id

    resolve rel from entity
      resolvable entity
      non-resolvable, entity related via multiple rels

    if resource does not exist, then ignore
    if resource does not exist or does not have rel key, then ignore
    if resource has cardinality of one, then ignore
    */

    test('move attached id', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          post: {
            o1: { categoryIds: ['c1', 'c2', 'c3', 'c4', 'c5'] },
          },
          category: {
            c1: { postIds: ['o1'] },
            c2: { postIds: ['o1'] },
            c3: { postIds: ['o1'] },
            c4: { postIds: ['o1'] },
            c5: { postIds: ['o1'] },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          post: ['o1'],
          category: ['c1', 'c2', 'c3', 'c4', 'c5'],
        },
      };

      const result = forumReducer(
        state,
        forumActionCreators.moveAttached(
          ForumEntities.POST,
          'o1',
          'categoryIds',
          1,
          3
        )
      );

      const expected = {
        resources: {
          ...forumEmptyState.resources,
          post: {
            o1: { categoryIds: ['c1', 'c3', 'c4', 'c2', 'c5'] },
          },
          category: {
            c1: { postIds: ['o1'] },
            c2: { postIds: ['o1'] },
            c3: { postIds: ['o1'] },
            c4: { postIds: ['o1'] },
            c5: { postIds: ['o1'] },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          post: ['o1'],
          category: ['c1', 'c2', 'c3', 'c4', 'c5'],
        },
      };

      expect(result).toEqual(expected);
    });

    describe('resolve rel from entity', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          post: {
            o1: { childIds: ['o2'], categoryIds: ['c1', 'c2', 'c3'] },
            o2: { parentId: 'o1' },
          },
          category: {
            c1: { postIds: ['o1'] },
            c2: { postIds: ['o1'] },
            c3: { postIds: ['o1'] },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          post: ['o1', 'o2'],
          category: ['c1', 'c2', 'c3'],
        },
      };

      test('resolvable entity', () => {
        const result = forumReducer(
          state,
          forumActionCreators.moveAttached(
            ForumEntities.POST,
            'o1',
            ForumEntities.CATEGORY,
            0,
            1
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { childIds: ['o2'], categoryIds: ['c2', 'c1', 'c3'] },
              o2: { parentId: 'o1' },
            },
            category: {
              c1: { postIds: ['o1'] },
              c2: { postIds: ['o1'] },
              c3: { postIds: ['o1'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1', 'o2'],
            category: ['c1', 'c2', 'c3'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('non-resolvable, entity related via multiple rels', () => {
        const result = forumReducer(
          state,
          forumActionCreators.moveAttached(
            ForumEntities.POST,
            'o1',
            ForumEntities.POST,
            0,
            1
          )
        );

        expect(result).toEqual(state);
      });
    });

    test('if resource does not exist or does not have rel key, then ignore', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          post: {
            o1: {},
          },
        },
        ids: {
          ...forumEmptyState.ids,
          post: ['o1'],
        },
      };

      [
        forumReducer(
          state,
          forumActionCreators.moveAttached(
            ForumEntities.POST,
            'o2',
            'categoryIds',
            1,
            3
          )
        ),
        forumReducer(
          state,
          forumActionCreators.moveAttached(
            ForumEntities.POST,
            'o1',
            'categoryIds',
            1,
            3
          )
        ),
      ].forEach(result => expect(result).toEqual(state));
    });

    test('if rel is cardinality of one, then ignore', () => {
      const state = {
        resources: {
          ...forumEmptyState.resources,
          account: {
            a1: { profileId: 'p1' },
          },
          profile: {
            p1: { accountId: 'a1' },
          },
        },
        ids: {
          ...forumEmptyState.ids,
          account: ['a1'],
          profile: ['p1'],
        },
      };

      const result = forumReducer(
        state,
        forumActionCreators.moveAttached(
          ForumEntities.ACCOUNT,
          'a1',
          'profileId',
          0,
          3
        )
      );

      expect(result).toEqual(state);
    });
  });

  // test('set state', () => {
  //   const state = {
  //     ...forumEmptyState,
  //     account: {
  //       'a1': { profileId: 'p1' }
  //     },
  //     profile: {
  //       'p1': { accountId: 'a1' }
  //     }
  //   };
  //
  //   const result = forumReducer(undefined, forumActionCreators.setState(state));
  //
  //   expect(result).toEqual(state);
  // });

  // test('set entity state', () => {
  //   [undefined, forumEmptyState].forEach(state => {
  //     const entityState = {
  //       'a1': { profileId: 'p1' }
  //     };
  //
  //     const result = forumReducer(state, forumActionCreators.setEntityState(
  //       ForumEntities.ACCOUNT, entityState
  //     ));
  //
  //     const expected = {
  //       ...forumEmptyState,
  //       account: {
  //         'a1': { profileId: 'p1' }
  //       },
  //     };
  //
  //     expect(result).toEqual(expected);
  //   });
  // });

  // test('set resource state', () => {
  //   [undefined, forumEmptyState].forEach(state => {
  //     const resourceState = {
  //       profileId: 'p200', categoryIds: ['c1']
  //     };
  //
  //     const result = forumReducer(state, forumActionCreators.setResourceState(
  //       ForumEntities.POST, 'o1', resourceState
  //     ));
  //
  //     const expected = {
  //       ...forumEmptyState,
  //       post: {
  //         'o1': { profileId: 'p200', categoryIds: ['c1'] }
  //       }
  //     };
  //
  //     expect(result).toEqual(expected);
  //   });
  // });

  // test('set rel state', () => {
  //   [undefined, forumEmptyState].forEach(state => {
  //     const result = forumReducer(state, forumActionCreators.setRelState(
  //       ForumEntities.POST, 'o1', 'categoryIds', ['c1']
  //     ));
  //
  //     const expected = {
  //       ...forumEmptyState,
  //       post: {
  //         'o1': { categoryIds: ['c1'] }
  //       }
  //     };
  //
  //     expect(result).toEqual(expected);
  //   });
  // });

  // test('state setters: if entity is invalid, then ignore', () => {
  //   [
  //     forumReducer(forumEmptyState, forumActionCreators.setEntityState(
  //       'chicken', { 'k1': { profileId: 'p1' } }
  //     )),
  //     forumReducer(forumEmptyState, forumActionCreators.setResourceState(
  //       'chicken', 'k1', { profileId: 'p200', categoryIds: ['c1'] }
  //     )),
  //     forumReducer(forumEmptyState, forumActionCreators.setRelState(
  //       'chicken', 'k1', 'categoryIds', ['c1'],
  //     )),
  //   ].forEach(result => expect(result).toEqual(forumEmptyState));
  // });

  describe('batched actions', () => {
    describe('basic', () => {
      test('add-actions', () => {
        const result = forumReducer(
          undefined,
          forumActionCreators.batch(
            forumActionCreators.add(ForumEntities.ACCOUNT, 'a1'),
            forumActionCreators.add(ForumEntities.ACCOUNT, 'a2')
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: undefined },
              a2: { profileId: undefined },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1', 'a2'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('remove-actions', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
              a2: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1', 'a2'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.batch(
            forumActionCreators.remove(ForumEntities.ACCOUNT, 'a1'),
            forumActionCreators.remove(ForumEntities.ACCOUNT, 'a2')
          )
        );

        expect(result).toEqual(forumEmptyState);
      });

      test('attach-actions', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: {},
            },
            profile: {
              p1: {},
            },
            post: {
              o1: {},
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.batch(
            forumActionCreators.attach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1'
            ),
            forumActionCreators.attach(
              ForumEntities.PROFILE,
              'p1',
              'postIds',
              'o1'
            )
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: 'p1' },
            },
            profile: {
              p1: { accountId: 'a1', postIds: ['o1'] },
            },
            post: {
              o1: { profileId: 'p1' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('detach-actions', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: 'p1' },
            },
            profile: {
              p1: { accountId: 'a1', postIds: ['o1'] },
            },
            post: {
              o1: { profileId: 'p1' },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.batch(
            forumActionCreators.detach(
              ForumEntities.ACCOUNT,
              'a1',
              'profileId',
              'p1'
            ),
            forumActionCreators.detach(
              ForumEntities.PROFILE,
              'p1',
              'postIds',
              'o1'
            )
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            account: {
              a1: { profileId: undefined },
            },
            profile: {
              p1: { accountId: undefined, postIds: [] },
            },
            post: {
              o1: { profileId: undefined },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            account: ['a1'],
            profile: ['p1'],
            post: ['o1'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('move-attached actions', () => {
        const state = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c1', 'c2', 'c3', 'c4', 'c5'] },
            },
            category: {
              c1: { postIds: ['o1'] },
              c2: { postIds: ['o1'] },
              c3: { postIds: ['o1'] },
              c4: { postIds: ['o1'] },
              c5: { postIds: ['o1'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
            category: ['c1', 'c2', 'c3', 'c4', 'c5'],
          },
        };

        const result = forumReducer(
          state,
          forumActionCreators.batch(
            forumActionCreators.moveAttached(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              1,
              3
            ),
            forumActionCreators.moveAttached(
              ForumEntities.POST,
              'o1',
              'categoryIds',
              0,
              1
            )
          )
        );

        const expected = {
          resources: {
            ...forumEmptyState.resources,
            post: {
              o1: { categoryIds: ['c3', 'c1', 'c4', 'c2', 'c5'] },
            },
            category: {
              c1: { postIds: ['o1'] },
              c2: { postIds: ['o1'] },
              c3: { postIds: ['o1'] },
              c4: { postIds: ['o1'] },
              c5: { postIds: ['o1'] },
            },
          },
          ids: {
            ...forumEmptyState.ids,
            post: ['o1'],
            category: ['c1', 'c2', 'c3', 'c4', 'c5'],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('opposing operations negate each other', () => {
      /*
      remove detaches resources that were attached previously in batch (add and attach)
      */
    });
  });
});
